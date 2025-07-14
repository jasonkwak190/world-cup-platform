// 🔒 SECURITY: 보안 강화된 서버 사이드 마이그레이션 API
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { migrationSchema, validateRequest } from '@/lib/validations';
import { withAuth, verifyApiKey } from '@/lib/auth-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서버용 Supabase 클라이언트
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  // 🔒 SECURITY: 이중 인증 시스템 - 세션 기반 관리자 인증 + 레거시 API 키 지원
  const adminSecret = process.env.ADMIN_MIGRATION_SECRET;
  
  // 레거시 API 키 인증 지원 (하위 호환성)
  if (adminSecret && verifyApiKey(request, adminSecret)) {
    console.log('🔑 Migration authenticated via legacy API key');
    return await executeMigration(request);
  }
  
  // 🔒 SECURITY: 세션 기반 관리자 인증 (권장 방식)
  return withAuth(
    request,
    async (request, user) => {
      console.log('🔑 Migration authenticated via session:', user.username, '(', user.role, ')');
      return await executeMigration(request);
    },
    { 
      requireAdmin: true, 
      rateLimiter: 'admin',
      skipRateLimit: false 
    }
  );
}

// 🔒 SECURITY: 실제 마이그레이션 로직 분리
async function executeMigration(request: NextRequest) {

  try {
    const requestBody = await request.json();
    
    // 🔒 Zod 스키마 검증 적용
    const validation = validateRequest(migrationSchema, requestBody);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: '입력값 검증 실패', 
          details: validation.error 
        },
        { status: 400 }
      );
    }
    
    const { users, worldcups } = validation.data;

    const migrationResults = {
      userResults: [] as any[],
      worldCupResults: [] as any[],
      log: [] as string[]
    };

    migrationResults.log.push(`📂 받은 데이터: 사용자 ${users.length}명, 월드컵 ${worldcups?.length || 0}개`);

    // 사용자 마이그레이션
    for (const localUser of users) {
      try {
        // 1. Supabase Auth에 사용자 생성
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: localUser.email,
          password: 'temp123456', // 임시 비밀번호
          email_confirm: true,
          user_metadata: {
            username: localUser.username
          }
        });

        if (authError) {
          migrationResults.userResults.push({
            email: localUser.email,
            success: false,
            error: authError.message
          });
          migrationResults.log.push(`❌ Auth 생성 실패: ${localUser.email} - ${authError.message}`);
          continue;
        }

        // 2. users 테이블에 추가 정보 저장
        const { data: _userRecord, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUser.user.id,
            username: localUser.username,
            email: localUser.email,
            role: localUser.role || 'user'
          })
          .select()
          .single();

        if (userError) {
          // Auth 사용자 삭제 (롤백)
          try {
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
          } catch (e) {
            console.warn('Failed to delete auth user during rollback:', e);
          }
          
          migrationResults.userResults.push({
            email: localUser.email,
            success: false,
            error: userError.message
          });
          migrationResults.log.push(`❌ DB 저장 실패: ${localUser.email} - ${userError.message}`);
          continue;
        }

        migrationResults.userResults.push({
          email: localUser.email,
          success: true,
          userId: authUser.user.id,
          oldId: localUser.id
        });
        
        migrationResults.log.push(`✅ 사용자 생성 성공: ${localUser.email}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        migrationResults.userResults.push({
          email: localUser.email,
          success: false,
          error: errorMessage
        });
        migrationResults.log.push(`❌ 예외 발생: ${localUser.email} - ${errorMessage}`);
      }
    }

    const successfulUsers = migrationResults.userResults.filter(r => r.success);
    migrationResults.log.push(`👥 사용자 마이그레이션 완료: 성공 ${successfulUsers.length}명, 실패 ${users.length - successfulUsers.length}명`);

    // 월드컵 마이그레이션
    if (worldcups && worldcups.length > 0 && successfulUsers.length > 0) {
      migrationResults.log.push(`🏆 월드컵 마이그레이션 시작...`);

      for (const localWorldCup of worldcups) {
        try {
          // 작성자 찾기
          const authorResult = successfulUsers.find(result => {
            // users 배열에서 해당 username을 가진 사용자의 email 찾기
            const originalUser = users.find(u => u.username === localWorldCup.author);
            return originalUser && result.email === originalUser.email;
          });

          if (!authorResult) {
            migrationResults.worldCupResults.push({
              title: localWorldCup.title,
              success: false,
              error: '작성자를 찾을 수 없습니다'
            });
            migrationResults.log.push(`❌ 작성자 없음: ${localWorldCup.title}`);
            continue;
          }

          // 월드컵 데이터 저장
          const { data: worldCupRecord, error: worldCupError } = await supabaseAdmin
            .from('worldcups')
            .insert({
              title: localWorldCup.title,
              description: localWorldCup.description,
              category: localWorldCup.category || 'entertainment',
              author_id: authorResult.userId,
              participants: localWorldCup.participants || 0,
              likes: localWorldCup.likes || 0,
              comments: localWorldCup.comments || 0,
              is_public: localWorldCup.isPublic !== false
            })
            .select()
            .single();

          if (worldCupError) {
            migrationResults.worldCupResults.push({
              title: localWorldCup.title,
              success: false,
              error: worldCupError.message
            });
            migrationResults.log.push(`❌ 월드컵 생성 실패: ${localWorldCup.title} - ${worldCupError.message}`);
            continue;
          }

          // 월드컵 아이템들 저장 (이미지는 임시로 placeholder 사용)
          if (localWorldCup.items && localWorldCup.items.length > 0) {
            const itemsData = localWorldCup.items.map((item: any, index: number) => ({
              worldcup_id: worldCupRecord.id,
              title: item.title,
              image_url: 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(item.title), // 임시 placeholder
              description: item.description,
              order_index: index
            }));

            const { error: itemsError } = await supabaseAdmin
              .from('worldcup_items')
              .insert(itemsData);

            if (itemsError) {
              migrationResults.log.push(`⚠️ 아이템 저장 실패: ${localWorldCup.title} - ${itemsError.message}`);
            }
          }

          migrationResults.worldCupResults.push({
            title: localWorldCup.title,
            success: true,
            worldCupId: worldCupRecord.id
          });
          
          migrationResults.log.push(`✅ 월드컵 생성 성공: ${localWorldCup.title}`);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          migrationResults.worldCupResults.push({
            title: localWorldCup.title,
            success: false,
            error: errorMessage
          });
          migrationResults.log.push(`❌ 월드컵 예외: ${localWorldCup.title} - ${errorMessage}`);
        }
      }

      const successfulWorldCups = migrationResults.worldCupResults.filter(r => r.success);
      migrationResults.log.push(`🏆 월드컵 마이그레이션 완료: 성공 ${successfulWorldCups.length}개, 실패 ${worldcups.length - successfulWorldCups.length}개`);
    }

    migrationResults.log.push(`🎉 마이그레이션 완료!`);
    migrationResults.log.push(`⚠️ 모든 사용자의 임시 비밀번호는 "temp123456"입니다.`);
    migrationResults.log.push(`💡 사용자들에게 비밀번호 변경을 안내해주세요.`);

    return NextResponse.json({
      success: true,
      message: '마이그레이션이 완료되었습니다!',
      ...migrationResults
    });

  } catch (error) {
    // 🔒 SECURITY: 상세 에러 정보는 로그에만 기록하고 클라이언트에는 일반적인 메시지만 전송
    console.error('Migration API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '마이그레이션 중 서버 오류가 발생했습니다.',
        message: 'An error occurred during migration. Please contact administrator.'
      },
      { status: 500 }
    );
  }
}