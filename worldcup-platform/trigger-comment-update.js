// 브라우저 콘솔에서 실행할 댓글 수 업데이트 트리거 스크립트
// 메인 페이지에서 이 코드를 실행하세요

// 특정 월드컵의 댓글 수 업데이트를 강제로 트리거
function triggerCommentUpdate(worldcupId, newCount) {
  console.log(`🔔 Triggering comment update for ${worldcupId}: ${newCount}`);
  
  // 이벤트 매니저가 존재하는지 확인
  if (window.commentEventManager && window.commentEventManager.notifyCommentCountChange) {
    window.commentEventManager.notifyCommentCountChange(worldcupId, newCount);
    console.log('✅ Event triggered via commentEventManager');
  } else if (window.notifyCommentCountChange) {
    window.notifyCommentCountChange(worldcupId, newCount);
    console.log('✅ Event triggered via global function');
  } else {
    console.log('⚠️ Comment event system not found. Creating custom event...');
    
    // 커스텀 이벤트 생성 및 발송
    const event = new CustomEvent('commentCountChange', {
      detail: { worldcupId, newCount }
    });
    window.dispatchEvent(event);
    console.log('✅ Custom event dispatched');
  }
}

// 현재 알려진 월드컵들의 댓글 수 업데이트
function updateKnownComments() {
  console.log('🔄 Updating known comment counts...');
  
  // ID "133"인 월드컵의 댓글 수를 5로 업데이트
  triggerCommentUpdate('144ff57a-0910-4292-98c2-45ba8e6434f4', 5); // 실제 ID로 수정 필요
  
  // 또는 모든 월드컵에 대해 강제 새로고침
  if (window.location.reload) {
    setTimeout(() => {
      console.log('🔄 Reloading page to ensure sync...');
      window.location.reload();
    }, 2000);
  }
}

// 페이지의 모든 월드컵 카드에서 ID 추출하여 업데이트
function updateAllVisibleCards() {
  console.log('🔍 Finding all worldcup cards on page...');
  
  // 카드 요소들을 찾아서 ID 추출 시도
  const cards = document.querySelectorAll('[data-worldcup-id]');
  console.log(`Found ${cards.length} cards with data-worldcup-id`);
  
  if (cards.length === 0) {
    // 다른 방법으로 카드 찾기
    const playButtons = document.querySelectorAll('a[href*="/play/"]');
    console.log(`Found ${playButtons.length} play buttons`);
    
    playButtons.forEach((button, index) => {
      const href = button.getAttribute('href');
      const match = href.match(/\/play\/([^\/\?]+)/);
      if (match) {
        const worldcupId = match[1];
        console.log(`Card ${index + 1}: ${worldcupId}`);
        
        // 특정 ID에 대해서만 업데이트
        if (worldcupId === '144ff57a-0910-4292-98c2-45ba8e6434f4' || 
            button.textContent.includes('133')) {
          triggerCommentUpdate(worldcupId, 5);
        }
      }
    });
  }
  
  if (cards.length === 0 && playButtons.length === 0) {
    console.log('❌ No cards found. Doing full page reload...');
    setTimeout(() => window.location.reload(), 1000);
  }
}

console.log(`
🔧 댓글 수 업데이트 도구

1. 특정 월드컵 업데이트: triggerCommentUpdate('worldcup-id', 5)
2. 알려진 댓글들 업데이트: updateKnownComments()  
3. 페이지의 모든 카드 업데이트: updateAllVisibleCards()

자동 실행: updateAllVisibleCards()
`);

// 전역 함수로 등록
window.triggerCommentUpdate = triggerCommentUpdate;
window.updateKnownComments = updateKnownComments;
window.updateAllVisibleCards = updateAllVisibleCards;

// 3초 후 자동 실행
setTimeout(() => {
  console.log('🚀 Auto-executing card update...');
  updateAllVisibleCards();
}, 3000);