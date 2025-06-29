// Node.js 환경에서 실행할 댓글 수 동기화 스크립트
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정 (환경변수에서 가져오기)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다.');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 모든 월드컵의 댓글 수 동기화
async function syncAllCommentCounts() {
  try {
    console.log('🔄 댓글 수 동기화 시작...');

    // 모든 월드컵 가져오기
    const { data: worldcups, error: worldcupsError } = await supabase
      .from('worldcups')
      .select('id, title, comments');

    if (worldcupsError) {
      console.error('월드컵 데이터 가져오기 실패:', worldcupsError);
      return;
    }

    if (!worldcups || worldcups.length === 0) {
      console.log('동기화할 월드컵이 없습니다.');
      return;
    }

    console.log(`📊 ${worldcups.length}개의 월드컵 발견`);

    // 각 월드컵별로 실제 댓글 수 계산
    for (const worldcup of worldcups) {
      try {
        // 실제 댓글 수 계산
        const { data: comments, error: commentsError } = await supabase
          .from('worldcup_comments')
          .select('id')
          .eq('worldcup_id', worldcup.id);

        if (commentsError) {
          console.error(`댓글 조회 실패 - ${worldcup.title}: ${commentsError.message}`);
          continue;
        }

        const actualCount = comments?.length || 0;
        const storedCount = worldcup.comments || 0;

        if (actualCount !== storedCount) {
          console.log(`🔧 ${worldcup.title}: ${storedCount} → ${actualCount}`);
          
          // 댓글 수 업데이트
          const { error: updateError } = await supabase
            .from('worldcups')
            .update({ comments: actualCount })
            .eq('id', worldcup.id);

          if (updateError) {
            console.error(`업데이트 실패 - ${worldcup.title}: ${updateError.message}`);
          } else {
            console.log(`✅ ${worldcup.title} 업데이트 완료`);
          }
        } else {
          console.log(`✓ ${worldcup.title}: ${actualCount} (이미 정확함)`);
        }

        // 너무 빠른 요청 방지
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`처리 중 오류 - ${worldcup.title}:`, error);
      }
    }

    console.log('🎉 댓글 수 동기화 완료!');

  } catch (error) {
    console.error('동기화 중 오류:', error);
  }
}

// 실행
syncAllCommentCounts();