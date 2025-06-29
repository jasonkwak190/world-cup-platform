// 브라우저 개발자 도구 콘솔에서 실행할 스크립트
// 메인 페이지(localhost:3000)에서 이 코드를 실행하세요

console.log('🔧 클라이언트 사이드 댓글 수 강제 업데이트 시작...');

// 1. 현재 페이지가 Next.js 앱인지 확인
if (typeof window === 'undefined') {
  console.error('❌ 브라우저에서 실행해주세요.');
} else {
  console.log('✅ 브라우저 환경 확인됨');
}

// 2. 로컬 스토리지 캐시 완전 삭제
function clearAllCache() {
  console.log('🧹 캐시 완전 삭제 중...');
  
  // 로컬 스토리지 전체 삭제
  localStorage.clear();
  console.log('✅ 로컬 스토리지 삭제됨');
  
  // 세션 스토리지 전체 삭제
  sessionStorage.clear();
  console.log('✅ 세션 스토리지 삭제됨');
  
  // IndexedDB도 가능하면 삭제
  if (typeof indexedDB !== 'undefined') {
    try {
      // Next.js나 브라우저 캐시 DB들 삭제 시도
      const dbNames = ['keyval-store', 'next-cache', 'workbox-precache'];
      dbNames.forEach(dbName => {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => console.log(`✅ ${dbName} DB 삭제됨`);
        deleteReq.onerror = () => console.log(`⚠️ ${dbName} DB 삭제 실패`);
      });
    } catch (e) {
      console.log('⚠️ IndexedDB 삭제 중 오류:', e.message);
    }
  }
}

// 3. Next.js 라우터 강제 새로고침
function forceRouterRefresh() {
  console.log('🔄 Next.js 라우터 새로고침...');
  
  // Next.js 라우터가 있는지 확인
  if (typeof window.next !== 'undefined' && window.next.router) {
    window.next.router.reload();
    console.log('✅ Next.js 라우터 새로고침 실행됨');
  } else {
    // 일반 페이지 새로고침
    window.location.reload(true);
    console.log('✅ 페이지 강제 새로고침 실행됨');
  }
}

// 4. 서비스 워커 캐시 삭제
async function clearServiceWorkerCache() {
  console.log('🧹 서비스 워커 캐시 삭제 중...');
  
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ 서비스 워커 등록 해제됨');
      }
    } catch (e) {
      console.log('⚠️ 서비스 워커 삭제 중 오류:', e.message);
    }
  }
  
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log(`✅ 캐시 ${cacheName} 삭제됨`);
      }
    } catch (e) {
      console.log('⚠️ 캐시 삭제 중 오류:', e.message);
    }
  }
}

// 5. 전체 캐시 삭제 및 새로고침 실행
async function performFullRefresh() {
  console.log('🚀 전체 캐시 삭제 및 새로고침 시작...');
  
  clearAllCache();
  await clearServiceWorkerCache();
  
  console.log('⏳ 3초 후 페이지 새로고침...');
  setTimeout(() => {
    forceRouterRefresh();
  }, 3000);
}

// 6. 메인 실행 함수
console.log(`
🎯 댓글 수 강제 업데이트 도구

명령어:
1. clearAllCache() - 캐시만 삭제
2. forceRouterRefresh() - 페이지만 새로고침
3. performFullRefresh() - 전체 캐시 삭제 후 새로고침

자동 실행: performFullRefresh()
`);

// 전역 함수로 등록
window.clearAllCache = clearAllCache;
window.forceRouterRefresh = forceRouterRefresh; 
window.performFullRefresh = performFullRefresh;

// 5초 후 자동 실행
console.log('⏳ 5초 후 자동으로 전체 새로고침 실행...');
setTimeout(performFullRefresh, 5000);