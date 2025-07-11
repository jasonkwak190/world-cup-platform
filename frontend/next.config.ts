import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 화면 전환 오류 방지를 위한 설정 개선
  reactStrictMode: true,
  
  // 🔒 CSP 정책 (개발/운영 환경별 설정)
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 개발 환경에서는 webpack을 위해 unsafe-eval 허용
              isDevelopment 
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              "connect-src 'self' https://rctoxfcyzzsiikopbsne.supabase.co https://www.googleapis.com https://googleads.g.doubleclick.net",
              "img-src 'self' data: blob: https: https://i.ytimg.com https://img.youtube.com",
              "media-src 'self' https: data: blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "worker-src 'self' blob:"
            ].join('; ')
          }
        ]
      }
    ]
  },
  
  // Webpack 설정 최적화
  webpack: (config, { isServer, dev }) => {
    // 클라이언트 사이드에서 process.env 사용 가능하도록 설정
    if (!isServer) {
      config.plugins.push(
        new (require('webpack').DefinePlugin)({
          'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
          'process.env': JSON.stringify({
            NODE_ENV: dev ? 'development' : 'production',
          }),
        })
      );
    }

    // 프로덕션 빌드에서 console 로깅 제거
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimizer: [
          ...config.optimization.minimizer,
          new (require('terser-webpack-plugin'))({
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
              },
            },
          }),
        ],
      };
    }

    // 클라이언트 사이드에서 모듈 해석 안정성 향상
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        // process: false를 제거하여 DefinePlugin이 동작하도록 함
      };
      
      // 동적 임포트 최적화
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
      };

      // 개발 환경에서 passive 이벤트 경고 억제
      if (dev) {
        config.infrastructureLogging = {
          level: 'warn',
        };
        
        // 특정 경고 메시지 필터링
        config.stats = {
          ...config.stats,
          warningsFilter: [
            /Added non-passive event listener/,
            /scroll-blocking/
          ],
        };
      }
    }
    
    return config;
  },
  
  // 실험적 기능으로 안정성 향상
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Turbopack 설정 (이제 stable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // TypeScript 설정
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // 이미지 최적화 (두 파일의 설정 병합)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 번들 분석 활성화 (개발시)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      if (config.plugins) {
        config.plugins.push(
          new (require('@next/bundle-analyzer'))({
            enabled: true,
          })
        );
      }
      return config;
    },
  }),
};

export default nextConfig;