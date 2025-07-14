// API Authentication Middleware
// 🔒 SECURITY: 강력한 인증 시스템으로 API 엔드포인트 보호

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, checkRateLimit, getUserIdentifier } from '@/lib/ratelimit';

// 사용자 인증 정보 타입
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  username?: string;
}

// 인증 결과 타입
export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

// 🔒 SECURITY: Supabase 세션 기반 사용자 인증 (경량화)
export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    // 🚨 PERFORMANCE: 개발환경에서 인증 간소화
    if (process.env.NODE_ENV === 'development') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'No valid authorization header found' };
      }
      
      // 개발환경에서는 토큰이 있으면 기본 사용자로 인증
      return {
        success: true,
        user: {
          id: 'dev-user',
          email: 'dev@example.com',
          role: 'user',
          username: 'DevUser'
        }
      };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No valid authorization header found' };
    }
    
    const token = authHeader.slice(7);
    
    // 토큰으로 사용자 확인
    const { data: { user }, error: sessionError } = await supabase.auth.getUser(token);
    
    if (sessionError) {
      console.error('Session verification error:', sessionError);
      return { success: false, error: 'Authentication failed' };
    }
    
    if (!user) {
      return { success: false, error: 'No valid user found' };
    }
    
    // 사용자 정보 데이터베이스에서 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, username, role')
      .eq('id', user.id)
      .single();
    
    if (userError) {
      console.error('User data fetch error:', userError);
      // 데이터베이스에 사용자 정보가 없어도 기본 권한으로 허용
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || '',
          role: 'user',
          username: user.user_metadata?.username || 'User'
        }
      };
    }
    
    return {
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        username: userData.username
      }
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

// 🔒 SECURITY: 관리자 권한 확인
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateUser(request);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }
  
  if (authResult.user.role !== 'admin') {
    return { success: false, error: 'Admin privileges required' };
  }
  
  return authResult;
}

// 🔒 SECURITY: Rate Limiting과 인증을 결합한 미들웨어
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>,
  options?: {
    requireAdmin?: boolean;
    rateLimiter?: keyof typeof rateLimiters;
    skipRateLimit?: boolean;
  }
): Promise<NextResponse> {
  try {
    // Rate Limiting 적용
    if (!options?.skipRateLimit) {
      const limiterKey = options?.rateLimiter || 'api';
      const limiter = rateLimiters[limiterKey];
      const identifier = getUserIdentifier(request);
      
      const rateLimitResult = await checkRateLimit(limiter, identifier);
      
      if (!rateLimitResult.success) {
        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter || 60} seconds.`,
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            resetTime: new Date(rateLimitResult.reset).toISOString(),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.reset.toString(),
              'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
            },
          }
        );
      }
    }
    
    // 인증 확인
    const authResult = options?.requireAdmin 
      ? await requireAdmin(request)
      : await authenticateUser(request);
    
    if (!authResult.success || !authResult.user) {
      return new Response(
        JSON.stringify({
          error: 'Authentication failed',
          message: authResult.error || 'Invalid or missing authentication'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 인증된 사용자로 핸들러 실행
    return await handler(request, authResult.user);
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Authentication middleware failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 🔒 SECURITY: 익명 사용자 허용하는 옵셔널 인증 미들웨어
export async function withOptionalAuth(
  request: NextRequest,
  handler: (request: NextRequest, user?: AuthenticatedUser) => Promise<NextResponse>,
  options?: {
    rateLimiter?: keyof typeof rateLimiters;
    skipRateLimit?: boolean;
  }
): Promise<NextResponse> {
  try {
    // Rate Limiting 적용
    if (!options?.skipRateLimit) {
      const limiterKey = options?.rateLimiter || 'api';
      const limiter = rateLimiters[limiterKey];
      const identifier = getUserIdentifier(request);
      
      const rateLimitResult = await checkRateLimit(limiter, identifier);
      
      if (!rateLimitResult.success) {
        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter || 60} seconds.`,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
            },
          }
        );
      }
    }
    
    // 옵셔널 인증 시도
    const authResult = await authenticateUser(request);
    const user = authResult.success ? authResult.user : undefined;
    
    // 인증 여부와 관계없이 핸들러 실행
    return await handler(request, user);
    
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Middleware failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 🔒 SECURITY: 월드컵 소유권 확인 유틸리티
export async function verifyWorldcupOwnership(
  worldcupId: string, 
  userId: string
): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { data, error } = await supabase
      .from('worldcups')
      .select('author_id')
      .eq('id', worldcupId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.author_id === userId;
  } catch (error) {
    console.error('Worldcup ownership verification error:', error);
    return false;
  }
}

// 🔒 SECURITY: 공개 월드컵 확인 유틸리티
export async function isWorldcupPublic(worldcupId: string): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { data, error } = await supabase
      .from('worldcups')
      .select('is_public')
      .eq('id', worldcupId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.is_public;
  } catch (error) {
    console.error('Worldcup public check error:', error);
    return false;
  }
}

// 🔒 SECURITY: API 키 기반 인증 (레거시 지원용)
export function verifyApiKey(request: NextRequest, expectedKey?: string): boolean {
  if (!expectedKey) return false;
  
  const authHeader = request.headers.get('authorization');
  const apiKey = request.headers.get('x-api-key');
  const adminToken = request.headers.get('x-admin-token');
  
  // Bearer 토큰 확인
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return token === expectedKey;
  }
  
  // API 키 확인
  if (apiKey === expectedKey) {
    return true;
  }
  
  // Admin 토큰 확인
  if (adminToken === expectedKey) {
    return true;
  }
  
  return false;
}

// 🔒 SECURITY: 에러 응답 생성 유틸리티
export function createAuthErrorResponse(message: string, status: number = 401): NextResponse {
  return new Response(
    JSON.stringify({
      error: 'Authentication Error',
      message,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
}