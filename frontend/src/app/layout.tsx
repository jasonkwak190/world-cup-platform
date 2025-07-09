import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";



export const metadata: Metadata = {
  title: "WorldCup Platform - 차세대 이상형 월드컵",
  description: "더 나은 UX와 편의성을 제공하는 이상형 월드컵 플랫폼",
  manifest: "/manifest.json",
  icons: {
    icon: '/icons/icon-192x192.svg',
    shortcut: '/icons/icon-192x192.svg',
    apple: '/icons/icon-192x192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "월드컵 플랫폼",
  },
  openGraph: {
    title: "WorldCup Platform - 차세대 이상형 월드컵",
    description: "더 나은 UX와 편의성을 제공하는 이상형 월드컵 플랫폼",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorldCup Platform - 차세대 이상형 월드컵",
    description: "더 나은 UX와 편의성을 제공하는 이상형 월드컵 플랫폼",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/icons/icon-192x192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-TileImage" content="/icons/icon-192x192.svg" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ClientProviders>
          {children}
        </ClientProviders>
        <script
          dangerouslySetInnerHTML={{
            __html: `

              // 🚀 스크롤 성능 최적화: passive 이벤트 리스너 설정 및 경고 억제
              (function() {
                // 기본 addEventListener 메서드 백업
                const originalAddEventListener = EventTarget.prototype.addEventListener;
                
                // addEventListener 오버라이드
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
                  
                  return originalAddEventListener.call(this, type, listener, options);
                };
                
                console.log('✅ Enhanced passive event listeners initialized');
              })();

              // 🔇 개발 환경에서 passive 이벤트 경고 억제 (선택적)
              if (process.env.NODE_ENV === 'development') {
                const originalConsoleWarn = console.warn;
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('Added non-passive event listener') && 
                      message.includes('scroll-blocking')) {
                    return; // 이 경고만 무시
                  }
                  return originalConsoleWarn.apply(console, args);
                };
              }
              
              // Service Worker 등록 (캐시 충돌 방지)
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✅ SW registered: ', registration);
                      // 캐시 업데이트 체크
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              console.log('🔄 New SW version available, will update on next navigation');
                            }
                          });
                        }
                      });
                    })
                    .catch(function(registrationError) {
                      console.log('❌ SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
