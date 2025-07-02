// localStorage 데이터를 Supabase로 마이그레이션하는 유틸리티
import { supabase, createUserWithAdmin } from '@/lib/supabase';
import { uploadProfileImage, uploadWorldCupThumbnail, uploadMultipleItemImages, base64ToFile } from '@/utils/supabaseStorage';
import type { SupabaseUserInsert, SupabaseWorldCupInsert, SupabaseWorldCupItemInsert } from '@/types/supabase';

// localStorage에서 데이터 가져오기
function getLocalStorageData() {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const worldcups = JSON.parse(localStorage.getItem('worldcups') || '[]');
    return { users, worldcups };
  } catch (error) {
    console.error('Error reading localStorage:', error);
    return { users: [], worldcups: [] };
  }
}

// 사용자 데이터 마이그레이션
async function migrateUsers(localUsers: any[]) {
  const results = [];
  
  for (const localUser of localUsers) {
    try {
      // 1. Supabase Auth에 사용자 생성 (Admin API 사용)
      const { data: authUser, error: authError } = await createUserWithAdmin(
        localUser.email,
        'temp123456', // 임시 비밀번호 - 사용자가 나중에 변경해야 함
        { username: localUser.username }
      );

      if (authError) {
        console.error(`Auth user creation failed for ${localUser.email}:`, authError);
        results.push({ email: localUser.email, success: false, error: authError.message });
        continue;
      }

      // 2. users 테이블에 추가 정보 저장
      const userData: SupabaseUserInsert = {
        id: authUser.user.id,
        username: localUser.username,
        email: localUser.email,
        role: localUser.role || 'user',
        profile_image_url: null // 프로필 이미지는 나중에 업로드
      };

      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (userError) {
        console.error(`User record creation failed for ${localUser.email}:`, userError);
        // Auth 사용자 삭제 (롤백) - 오류 무시
        try {
          await supabase.auth.admin.deleteUser(authUser.user.id);
        } catch (e) {
          console.warn('Failed to delete auth user during rollback:', e);
        }
        results.push({ email: localUser.email, success: false, error: userError.message });
        continue;
      }

      // 3. 프로필 이미지 업로드 (있는 경우)
      if (localUser.profileImage) {
        try {
          const file = base64ToFile(localUser.profileImage, `profile_${localUser.username}.jpg`);
          const uploadResult = await uploadProfileImage(file, authUser.user.id);
          
          if (uploadResult.success) {
            // 프로필 이미지 URL 업데이트
            await supabase
              .from('users')
              .update({ profile_image_url: uploadResult.url })
              .eq('id', authUser.user.id);
          }
        } catch (error) {
          console.warn(`Profile image upload failed for ${localUser.username}:`, error);
        }
      }

      results.push({ 
        email: localUser.email, 
        success: true, 
        userId: authUser.user.id,
        oldId: localUser.id 
      });

    } catch (error) {
      console.error(`Migration failed for user ${localUser.email}:`, error);
      results.push({ email: localUser.email, success: false, error: error.message });
    }
  }

  return results;
}

// 월드컵 데이터 마이그레이션
async function migrateWorldCups(localWorldCups: any[], userMigrationResults: any[]) {
  const results = [];

  for (const localWorldCup of localWorldCups) {
    try {
      // 작성자 ID 찾기
      const authorResult = userMigrationResults.find(
        result => result.success && result.email === getEmailByUsername(localWorldCup.author)
      );

      if (!authorResult) {
        console.error(`Author not found for worldcup: ${localWorldCup.title}`);
        results.push({ 
          title: localWorldCup.title, 
          success: false, 
          error: 'Author not migrated' 
        });
        continue;
      }

      // 1. 월드컵 기본 정보 저장
      const worldCupData: SupabaseWorldCupInsert = {
        title: localWorldCup.title,
        description: localWorldCup.description,
        category: localWorldCup.category || 'entertainment',
        author_id: authorResult.userId,
        participants: localWorldCup.participants || 0,
        likes: localWorldCup.likes || 0,
        comments: localWorldCup.comments || 0,
        is_public: localWorldCup.isPublic !== false
      };

      const { data: worldCupRecord, error: worldCupError } = await supabase
        .from('worldcups')
        .insert(worldCupData)
        .select()
        .single();

      if (worldCupError) {
        console.error(`WorldCup creation failed for ${localWorldCup.title}:`, worldCupError);
        results.push({ 
          title: localWorldCup.title, 
          success: false, 
          error: worldCupError.message 
        });
        continue;
      }

      // 2. 썸네일 업로드 (있는 경우)
      if (localWorldCup.thumbnail && localWorldCup.thumbnail.startsWith('data:')) {
        try {
          const file = base64ToFile(localWorldCup.thumbnail, `thumbnail_${worldCupRecord.id}.jpg`);
          const uploadResult = await uploadWorldCupThumbnail(file, worldCupRecord.id);
          
          if (uploadResult.success) {
            await supabase
              .from('worldcups')
              .update({ thumbnail_url: uploadResult.url })
              .eq('id', worldCupRecord.id);
          }
        } catch (error) {
          console.warn(`Thumbnail upload failed for ${localWorldCup.title}:`, error);
        }
      }

      // 3. 월드컵 아이템들 마이그레이션
      if (localWorldCup.items && localWorldCup.items.length > 0) {
        const itemsData: SupabaseWorldCupItemInsert[] = localWorldCup.items.map((item: any, index: number) => ({
          worldcup_id: worldCupRecord.id,
          title: item.title,
          image_url: '', // 이미지 업로드 후 업데이트
          description: item.description,
          order_index: index
        }));

        const { data: itemRecords, error: itemsError } = await supabase
          .from('worldcup_items')
          .insert(itemsData)
          .select();

        if (itemsError) {
          console.error(`Items creation failed for ${localWorldCup.title}:`, itemsError);
        } else {
          // 4. 아이템 이미지들 업로드
          const imageUploads = localWorldCup.items
            .filter((item: any) => item.image && item.image.startsWith('data:'))
            .map((item: any, index: number) => ({
              file: item.image,
              itemId: itemRecords[index].id
            }));

          if (imageUploads.length > 0) {
            const uploadResults = await uploadMultipleItemImages(imageUploads, worldCupRecord.id);
            
            // 이미지 URL 업데이트
            for (const uploadResult of uploadResults) {
              if (uploadResult.success) {
                await supabase
                  .from('worldcup_items')
                  .update({ image_url: uploadResult.url })
                  .eq('id', uploadResult.itemId);
              }
            }
          }
        }
      }

      results.push({ 
        title: localWorldCup.title, 
        success: true, 
        worldCupId: worldCupRecord.id 
      });

    } catch (error) {
      console.error(`Migration failed for worldcup ${localWorldCup.title}:`, error);
      results.push({ 
        title: localWorldCup.title, 
        success: false, 
        error: error.message 
      });
    }
  }

  return results;
}

// 사용자명으로 이메일 찾기 (localStorage 데이터에서)
function getEmailByUsername(username: string): string {
  const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
  const user = localUsers.find((u: any) => u.username === username);
  return user?.email || '';
}

// 전체 마이그레이션 실행 - API를 통해 서버에서 처리
export async function migrateAllData() {
  const startTime = Date.now();

  try {
    const { users, worldcups } = getLocalStorageData();
    
    if (users.length === 0 && worldcups.length === 0) {
      return {
        success: false,
        message: '마이그레이션할 데이터가 없습니다.',
        log: ['❌ 마이그레이션할 데이터가 없습니다.']
      };
    }

    // API를 통해 서버에서 마이그레이션 실행
    const response = await fetch('/api/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ users, worldcups })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || '서버 오류가 발생했습니다.');
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    // 소요 시간 추가
    result.log = result.log || [];
    result.log.push(`⏱️ 총 소요 시간: ${duration}초`);

    return result;

  } catch (error) {
    console.error('Migration error:', error);
    
    return {
      success: false,
      message: '마이그레이션 중 오류가 발생했습니다.',
      log: [`❌ 마이그레이션 오류: ${error.message}`],
      error: error.message
    };
  }
}

// localStorage 데이터 백업
export function backupLocalStorageData() {
  const { users, worldcups } = getLocalStorageData();
  const backup = {
    users,
    worldcups,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };

  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `worldcup-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}