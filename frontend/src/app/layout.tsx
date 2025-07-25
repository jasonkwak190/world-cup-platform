import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import "./globals.css";

// Dynamic import to prevent hydration issues
const ClientProviders = dynamic(() => import('@/components/ClientProviders'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  )
});



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
        <ErrorBoundary>
          <ClientProviders>
            {children}
          </ClientProviders>
        </ErrorBoundary>
        <script src="/js/performance-optimizations.js" async></script>
      </body>
    </html>
  );
}
