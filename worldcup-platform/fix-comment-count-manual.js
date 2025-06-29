// 브라우저 콘솔에서 실행할 댓글 수 수정 스크립트
// 이 스크립트를 개발자 도구 콘솔에 붙여넣고 실행하세요.

// 1. 현재 페이지의 월드컵 ID 가져오기
function getCurrentWorldcupId() {
  const url = window.location.href;
  const match = url.match(/worldcup\/([^\/\?]+)/);
  if (match) {
    const worldcupId = match[1];
    console.log('Current worldcup ID:', worldcupId);
    return worldcupId;
  } else {
    console.log('No worldcup ID found in URL');
    return null;
  }
}

// 2. 특정 월드컵의 댓글 수 확인 및 수정
async function fixCommentCountForCurrent() {
  const worldcupId = getCurrentWorldcupId();
  if (!worldcupId) {
    console.error('월드컵 ID를 찾을 수 없습니다.');
    return;
  }

  try {
    console.log('🔄 댓글 수 동기화 시작...');
    
    // 실제 댓글 수 계산 (Supabase에서)
    const { createClient } = window.supabase || {};
    if (!createClient) {
      console.error('Supabase client not found. Make sure you are on the worldcup page.');
      return;
    }

    // 동기화 함수 직접 호출
    if (window.syncCommentCounts) {
      await window.syncCommentCounts();
      console.log('✅ 모든 월드컵의 댓글 수가 동기화되었습니다.');
    } else {
      console.log('syncCommentCounts 함수를 찾을 수 없습니다. 페이지를 새로고침 해보세요.');
    }

    // 페이지 새로고침으로 변경사항 확인
    setTimeout(() => {
      console.log('페이지를 새로고침하여 변경사항을 확인합니다...');
      window.location.reload();
    }, 2000);

  } catch (error) {
    console.error('댓글 수 수정 중 오류:', error);
  }
}

// 3. 실행 가이드
console.log(`
📋 댓글 수 수정 가이드:

1. 현재 월드컵 ID 확인:
   getCurrentWorldcupId()

2. 댓글 수 자동 수정:
   fixCommentCountForCurrent()

3. 또는 브라우저에서 직접:
   - F12 키로 개발자도구 열기
   - Console 탭 클릭
   - fixCommentCountForCurrent() 입력하고 Enter
`);

// 전역 함수로 등록
window.getCurrentWorldcupId = getCurrentWorldcupId;
window.fixCommentCountForCurrent = fixCommentCountForCurrent;

// 자동 실행 (주석 해제하면 페이지 로드시 자동으로 수정됨)
// fixCommentCountForCurrent();