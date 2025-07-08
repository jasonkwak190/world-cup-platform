import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";



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
        <AuthProvider>
          <ErrorBoundary fallback={undefined}>
            {children}
          </ErrorBoundary>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 화면 전환 오류 방지를 위한 글로벌 에러 핸들러
              window.addEventListener('error', function(e) {
                if (e.message.includes('reading \\'call\\'') || e.message.includes('Cannot read properties of undefined')) {
                  console.warn('⚠️ Module loading error caught, reloading...', e.message);
                  // 심각한 모듈 로딩 오류시에만 새로고침
                  if (e.filename && e.filename.includes('_next/static')) {
                    setTimeout(() => window.location.reload(), 100);
                  }
                  e.preventDefault();
                  return false;
                }
              });
              
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
