// 브라우저 콘솔에서 실행할 디버깅 스크립트

// 1단계: 현재 worldcup의 comments 컬럼 값 확인
async function checkCurrentCommentCount(worldcupId) {
  const response = await fetch('/api/check-comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ worldcupId })
  });
  const result = await response.json();
  console.log('Current comment count in DB:', result);
}

// 2단계: 실제 댓글 수 계산
async function getActualCommentCount(worldcupId) {
  // 이 함수는 Supabase 클라이언트가 필요합니다
  console.log('실제 댓글 수를 확인하려면 Supabase에서 직접 확인해야 합니다.');
  console.log(`
    다음 SQL을 Supabase에서 실행해보세요:
    
    SELECT 
      w.id,
      w.title,
      w.comments as stored_count,
      COUNT(c.id) as actual_count
    FROM worldcups w
    LEFT JOIN worldcup_comments c ON w.id = c.worldcup_id
    WHERE w.id = '${worldcupId}'
    GROUP BY w.id, w.title, w.comments;
  `);
}

// 3단계: 댓글 수 수동 수정
async function fixCommentCount(worldcupId, actualCount) {
  console.log(`
    다음 SQL을 Supabase에서 실행해서 수정하세요:
    
    UPDATE worldcups 
    SET comments = ${actualCount} 
    WHERE id = '${worldcupId}';
  `);
}

// 4단계: 현재 보고 있는 월드컵 ID 확인
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

// 사용법 가이드
console.log(`
🔧 댓글 수 디버깅 도구

1. 현재 월드컵 ID 확인:
   getCurrentWorldcupId()

2. 실제 댓글 수 확인 (Supabase에서):
   getActualCommentCount('your-worldcup-id')

3. 댓글 수 수정 (Supabase에서):
   fixCommentCount('your-worldcup-id', actual_count)

예시: 현재 페이지의 월드컵 ID가 '144ff57a-0910-4292-98c2-45ba8e6434f4'이고
실제 댓글이 5개라면:

fixCommentCount('144ff57a-0910-4292-98c2-45ba8e6434f4', 5)
`);

// 전역 함수로 등록
window.getCurrentWorldcupId = getCurrentWorldcupId;
window.getActualCommentCount = getActualCommentCount;
window.fixCommentCount = fixCommentCount;