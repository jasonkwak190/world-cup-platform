// 🚀 성능 최적화 스크립트
(function() {
  // Add error tracking
  window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.includes("Cannot read properties of undefined (reading 'call')")) {
      console.error('🚨 DETECTED: Call error in performance optimizations script:', event.error);
      console.error('Stack:', event.error.stack);
    }
  });

  // 🚀 스크롤 성능 최적화: passive 이벤트 리스너 설정
  try {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    
    // Safety check to ensure originalAddEventListener is available
    if (typeof originalAddEventListener !== 'function') {
      console.warn('originalAddEventListener is not a function, skipping passive event listener optimization');
      return;
    }
    
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // 스크롤 관련 이벤트에 자동으로 passive 적용
      if (['touchstart', 'touchmove', 'wheel', 'mousewheel'].includes(type)) {
        if (typeof options === 'boolean') {
          options = { capture: options, passive: true };
        } else if (typeof options === 'object' && options !== null) {
          if (options.passive === undefined) {
            options.passive = true;
          }
        } else {
          options = { passive: true };
        }
      }
      
      // Additional safety check before calling
      if (typeof originalAddEventListener === 'function') {
        return originalAddEventListener.bind(this)(type, listener, options);
      } else {
        console.error('originalAddEventListener is not callable');
        return;
      }
    };
    
    console.log('✅ Enhanced passive event listeners initialized');
  } catch (error) {
    console.error('Passive event listener setup failed:', error);
  }

  // 🔇 개발 환경에서 passive 이벤트 경고 억제
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    try {
      const originalConsoleWarn = console.warn;
      console.warn = function(...args) {
        const message = args.join(' ');
        if (message.includes('Added non-passive event listener') && 
            message.includes('scroll-blocking')) {
          return;
        }
        return originalConsoleWarn.bind(console)(...args);
      };
    } catch (error) {
      console.error('Console warning suppression failed:', error);
    }
  }
  
  // Service Worker 등록 (안전한 방식)
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('✅ SW registered: ', registration);
        })
        .catch(function(error) {
          console.log('SW registration failed: ', error);
        });
    });
  }
})();