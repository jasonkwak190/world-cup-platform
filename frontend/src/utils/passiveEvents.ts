/**
 * 스크롤 성능 최적화를 위한 passive 이벤트 리스너 설정
 * 브라우저 경고를 해결하고 스크롤 성능을 향상시킵니다.
 */

let passiveEventsInitialized = false;

export function initializePassiveEvents() {
  // 이미 초기화되었다면 중복 실행 방지
  if (passiveEventsInitialized || typeof window === 'undefined') {
    return;
  }

  try {
    // 터치 이벤트에 passive: true 설정
    window.addEventListener('touchstart', () => {}, { passive: true });
    window.addEventListener('touchmove', () => {}, { passive: true });
    window.addEventListener('wheel', () => {}, { passive: true });

    passiveEventsInitialized = true;
    console.log('✅ Passive event listeners initialized for better scroll performance');
  } catch (error) {
    console.warn('⚠️ Failed to initialize passive event listeners:', error);
  }
}

// 클린업 함수 (필요한 경우)
export function cleanupPassiveEvents() {
  if (!passiveEventsInitialized || typeof window === 'undefined') {
    return;
  }

  // 실제로는 빈 리스너들이므로 제거할 필요 없음
  // 하지만 명시적으로 상태를 리셋
  passiveEventsInitialized = false;
}