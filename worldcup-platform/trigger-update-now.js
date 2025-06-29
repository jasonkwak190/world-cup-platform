// 브라우저 콘솔에서 실행 (메인 페이지에서)
// 댓글 수 변경 이벤트를 수동으로 트리거

console.log('🔔 댓글 수 업데이트 이벤트 트리거 중...');

// 133 월드컵 ID
const worldcupId = '144ff57a-d910-4292-98c2-45ba8e6434f4';
const newCount = 5;

// 이벤트 시스템이 로드되었는지 확인하고 트리거
if (typeof window !== 'undefined') {
  // 커스텀 이벤트로 강제 업데이트
  const event = new CustomEvent('forceCommentUpdate', {
    detail: { worldcupId, newCount }
  });
  
  window.dispatchEvent(event);
  console.log('✅ 커스텀 이벤트 발송됨');
  
  // 직접 DOM 업데이트 시도
  setTimeout(() => {
    const commentElements = document.querySelectorAll('[href*="/worldcup/144ff57a-d910-4292-98c2-45ba8e6434f4#comments"]');
    commentElements.forEach(el => {
      const textNode = el.querySelector('span');
      if (textNode) {
        textNode.textContent = '5';
        console.log('✅ DOM 직접 업데이트됨');
      }
    });
  }, 1000);
  
  // 3초 후 페이지 새로고침
  setTimeout(() => {
    console.log('🔄 페이지 새로고침...');
    window.location.reload();
  }, 3000);
}