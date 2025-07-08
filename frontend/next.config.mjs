/** @type {import('next').NextConfig} */
const nextConfig = {
  // 화면 전환 오류 방지를 위한 설정 개선
  reactStrictMode: true,
  
  // Webpack 설정 최적화
  webpack: (config, { isServer }) => {
    // 클라이언트 사이드에서 모듈 해석 안정성 향상
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
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
    }
    
    return config;
  },
  
  // 실험적 기능으로 안정성 향상
  experimental: {
    optimizePackageImports: ['lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // 이미지 최적화
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
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
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