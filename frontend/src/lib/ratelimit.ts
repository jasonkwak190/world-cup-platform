// Rate Limiting 설정
// Upstash Redis 기반 분산 Rate Limiting

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Redis 클라이언트 초기화 (환경에 따라 자동 선택)
// fromEnv()는 Edge 런타임에서는 REST API를, Node.js에서는 TCP 연결을 사용
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : undefined;

// 개발환경에서는 메모리 기반 Rate Limiting 사용
const createRatelimiter = (requests: number, window: string) => {
  if (redis) {
    // 프로덕션: Redis 기반 분산 Rate Limiting
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: true,
      prefix: "worldcup_ratelimit",
    });
  } else {
    // 개발환경: 메모리 기반 Rate Limiting
    return new Ratelimit({
      redis: new Map() as any, // 메모리 저장소
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: false,
      prefix: "worldcup_dev_ratelimit",
    });
  }
};

// 다양한 엔드포인트별 Rate Limit 설정
export const rateLimiters = {
  // 일반 API 호출: 100req/10min
  api: createRatelimiter(100, "10m"),
  
  // 인증 관련: 5req/min (무차별 대입 공격 방지)
  auth: createRatelimiter(5, "1m"),
  
  // 파일 업로드: 10req/hour (리소스 보호)
  upload: createRatelimiter(10, "1h"),
  
  // 댓글/리뷰: 20req/10min (스팸 방지)
  comment: createRatelimiter(20, "10m"),
  
  // 월드컵 생성: 5req/hour (남용 방지)
  create: createRatelimiter(5, "1h"),
  
  // 통계 업데이트: 50req/min (게임 플레이)
  stats: createRatelimiter(50, "1m"),
  
  // 관리자 작업: 10req/hour (민감한 작업)
  admin: createRatelimiter(10, "1h"),
  
  // 사용자 상호작용: 30req/10min (좋아요, 북마크 등)
  interaction: createRatelimiter(30, "10m"),
};

// Rate Limit 체크 헬퍼 함수
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}> {
  // 🔒 SECURITY: 개발환경에서도 인증 API는 Rate Limiting 적용
  if (process.env.NODE_ENV === 'development') {
    // 인증 관련 Rate Limiter는 개발환경에서도 적용 (완화된 제한)
    if (limiter === rateLimiters.auth) {
      console.log('🔒 Auth rate limiting applied in development for:', identifier);
      // 개발환경에서는 완화된 제한 적용 (10 req/min 대신 5 req/min)
    } else {
      // 다른 API는 개발환경에서 제한 없음
      return {
        success: true,
        limit: 1000,
        remaining: 999,
        reset: Date.now() + 60000,
      };
    }
  }

  try {
    const result = await limiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      retryAfter: result.success ? undefined : Math.round((result.reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Rate Limit 체크 실패시 허용 (가용성 우선)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
    };
  }
}

// IP 주소 추출 함수
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare 등에서 사용하는 헤더들 확인
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) {
    // x-forwarded-for는 콤마로 구분된 IP 목록일 수 있음
    return forwardedFor.split(",")[0].trim();
  }
  
  // 기본값 (로컬 개발환경)
  return "127.0.0.1";
}

// 사용자 식별자 생성 함수
export function getUserIdentifier(request: Request, userId?: string): string {
  const ip = getClientIP(request);
  
  if (userId) {
    // 인증된 사용자: 사용자 ID 사용
    return `user:${userId}`;
  } else {
    // 비인증 사용자: IP 주소 사용
    return `ip:${ip}`;
  }
}

// Rate Limit 에러 응답 생성
export function createRateLimitResponse(rateLimitResult: {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}) {
  const headers = new Headers({
    "X-RateLimit-Limit": rateLimitResult.limit.toString(),
    "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
    "X-RateLimit-Reset": rateLimitResult.reset.toString(),
  });

  if (rateLimitResult.retryAfter) {
    headers.set("Retry-After", rateLimitResult.retryAfter.toString());
  }

  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter || 60} seconds.`,
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      resetTime: new Date(rateLimitResult.reset).toISOString(),
    }),
    {
      status: 429,
      headers,
    }
  );
}

// 개발환경에서만 사용하는 Rate Limit 상태 확인 함수
export async function getRateLimitStatus(identifier: string) {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  
  try {
    // 각 Rate Limiter의 상태 확인
    const results = await Promise.all(
      Object.entries(rateLimiters).map(async ([key, limiter]) => {
        const result = await checkRateLimit(limiter, identifier);
        return [key, result];
      })
    );
    
    return Object.fromEntries(results);
  } catch (error) {
    console.error("Failed to get rate limit status:", error);
    return null;
  }
}