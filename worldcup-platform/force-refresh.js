// 브라우저 콘솔에서 실행할 강제 새로고침 스크립트
// 메인 페이지에서 이 코드를 실행하세요

// 1. 로컬 스토리지 캐시 클리어
function clearAllCache() {
  console.log('🧹 캐시 정리 중...');
  
  // 로컬 스토리지의 월드컵 관련 데이터 삭제
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('worldcup') || key.includes('comment'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('삭제:', key);
  });
  
  // 세션 스토리지도 정리
  const sessionKeysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('worldcup') || key.includes('comment'))) {
      sessionKeysToRemove.push(key);
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    console.log('세션 삭제:', key);
  });
  
  console.log('✅ 캐시 정리 완료');
}

// 2. 페이지 강제 새로고침
function forceRefresh() {
  console.log('🔄 페이지 새로고침...');
  window.location.reload(true); // 캐시 무시하고 새로고침
}

// 3. 자동 실행
function refreshMainPage() {
  clearAllCache();
  setTimeout(() => {
    forceRefresh();
  }, 1000);
}

console.log(`
🔧 메인 페이지 새로고침 도구

1. 캐시만 정리: clearAllCache()
2. 페이지만 새로고침: forceRefresh()  
3. 전체 새로고침: refreshMainPage()

자동 실행을 원하면: refreshMainPage()
`);

// 전역 함수로 등록
window.clearAllCache = clearAllCache;
window.forceRefresh = forceRefresh;
window.refreshMainPage = refreshMainPage;

// 5초 후 자동 실행 (주석 해제하면 활성화)
// setTimeout(refreshMainPage, 5000);