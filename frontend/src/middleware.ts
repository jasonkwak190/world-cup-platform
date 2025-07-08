// 🔒 Next.js 미들웨어 - Rate Limiting + 보안 헤더 적용
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, checkRateLimit, getUserIdentifier, createRateLimitResponse } from '@/lib/ratelimit';

// Rate Limiting을 적용할 경로별 설정
const RATE_LIMIT_CONFIG = {
  // 인증 관련 엔드포인트
  '/api/auth': 'auth',
  
  // 파일 업로드
  '/api/upload': 'upload',
  '/api/worldcup/upload': 'upload',
  
  // 댓글/소셜 기능
  '/api/comments': 'comment',
  '/api/likes': 'comment',
  
  // 월드컵 생성
  '/api/worldcup/create': 'create',
  '/api/worldcup': 'create', // POST 요청만
  
  // 통계 업데이트
  '/api/worldcup/*/stats': 'stats',
  '/api/stats': 'stats',
  
  // 관리자 기능
  '/api/rankings/global': 'admin', // POST만
  '/api/migrate': 'admin',
  '/api/admin': 'admin',
  
  // 기본 API (나머지 모든 API)
  '/api': 'api',
} as const;

// 🔒 보안 헤더 설정
const securityHeaders = {
  // XSS 공격 방지
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // HTTPS 강제 (1년)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer 정책
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // 권한 정책
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  
  // 콘텐츠 보안 정책
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http://localhost:* https://*.supabase.co https://*.supabase.in",
    "media-src 'self' blob: https:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in https://va.vercel-scripts.com wss://*.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),
};

// 개발환경용 완화된 CSP
const developmentCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data: https:",
  "img-src 'self' data: blob: https: http:",
  "media-src 'self' blob: https: http:",
  "connect-src 'self' https: http: ws: wss:",
  "frame-src 'self'",
  "object-src 'none'"
].join('; ');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 기본 응답 생성
  const response = NextResponse.next();
  
  // 🔒 모든 요청에 보안 헤더 적용
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    // 개발환경에서는 완화된 CSP 사용
    if (key === 'Content-Security-Policy' && isDevelopment) {
      response.headers.set(key, developmentCSP);
    } else {
      response.headers.set(key, value);
    }
  });

  // 개발환경 표시
  if (isDevelopment) {
    response.headers.set('X-Development-Mode', 'true');
  }

  // 정적 파일은 Rate Limiting 제외
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.includes('.') // 확장자가 있는 파일들
  ) {
    return response;
  }
  
  // API 경로가 아니면 보안 헤더만 적용하고 진행
  if (!pathname.startsWith('/api/')) {
    return response;
  }
  
  try {
    // 경로별 Rate Limiter 선택
    const rateLimiterType = getRateLimiterType(pathname, request.method);
    
    if (!rateLimiterType) {
      return NextResponse.next();
    }
    
    const limiter = rateLimiters[rateLimiterType];
    
    // 사용자 식별자 생성 (IP 기반 또는 인증된 사용자 ID)
    const userIdentifier = getUserIdentifier(request);
    
    // Rate Limit 체크
    const rateLimitResult = await checkRateLimit(limiter, userIdentifier);
    
    // Rate Limit 초과시 에러 응답 (보안 헤더 포함)
    if (!rateLimitResult.success) {
      console.log(`⚠️ Rate limit exceeded for ${userIdentifier} on ${pathname} (${rateLimiterType})`);
      const rateLimitResponse = createRateLimitResponse(rateLimitResult);
      
      // Rate Limit 응답에도 보안 헤더 적용
      Object.entries(securityHeaders).forEach(([key, value]) => {
        if (key === 'Content-Security-Policy' && isDevelopment) {
          rateLimitResponse.headers.set(key, developmentCSP);
        } else {
          rateLimitResponse.headers.set(key, value);
        }
      });
      
      return rateLimitResponse;
    }
    
    // Rate Limit 통과시 기존 응답에 정보 추가
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    
    // 개발환경에서는 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Rate limit OK: ${userIdentifier} ${pathname} (${rateLimiterType}) - ${rateLimitResult.remaining}/${rateLimitResult.limit} remaining`);
    }
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    // 미들웨어 에러시 요청을 계속 진행 (가용성 우선)
    return NextResponse.next();
  }
}

// 경로와 HTTP 메소드에 따라 적절한 Rate Limiter 타입 선택
function getRateLimiterType(pathname: string, method: string): keyof typeof rateLimiters | null {
  // POST 요청인 관리자 엔드포인트들
  if (method === 'POST') {
    if (pathname === '/api/rankings/global') return 'admin';
    if (pathname.startsWith('/api/worldcup') && pathname.includes('create')) return 'create';
    if (pathname.startsWith('/api/comments')) return 'comment';
    if (pathname.startsWith('/api/upload')) return 'upload';
  }
  
  // 경로별 매칭 (긴 경로부터 확인)
  const sortedPaths = Object.keys(RATE_LIMIT_CONFIG).sort((a, b) => b.length - a.length);
  
  for (const path of sortedPaths) {
    if (pathname.startsWith(path)) {
      return RATE_LIMIT_CONFIG[path as keyof typeof RATE_LIMIT_CONFIG];
    }
  }
  
  // 기본값: 일반 API Rate Limit
  return 'api';
}

// 미들웨어를 적용할 경로 설정 (보안 헤더 + Rate Limiting)
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 경로에 적용:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * API 경로는 Rate Limiting, 나머지는 보안 헤더만 적용
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};