// Rate Limit 상태 확인용 디버그 엔드포인트 (개발환경에서만 사용)
import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitStatus, getUserIdentifier } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  // 프로덕션에서는 비활성화
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 404 }
    );
  }

  try {
    const userIdentifier = getUserIdentifier(request);
    const status = await getRateLimitStatus(userIdentifier);
    
    return NextResponse.json({
      userIdentifier,
      timestamp: new Date().toISOString(),
      rateLimits: status,
      message: 'Rate limit status retrieved successfully'
    });
    
  } catch (error) {
    console.error('Debug rate limit status error:', error);
    return NextResponse.json(
      { error: 'Failed to get rate limit status' },
      { status: 500 }
    );
  }
}

// Rate Limit 리셋용 엔드포인트 (개발환경에서만)
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 404 }
    );
  }

  try {
    // 메모리 기반 Rate Limiter는 자동으로 리셋됨
    return NextResponse.json({
      message: 'Rate limits will reset automatically based on time windows',
      note: 'In development, rate limits use memory storage and reset on server restart'
    });
    
  } catch (error) {
    console.error('Debug rate limit reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset rate limits' },
      { status: 500 }
    );
  }
}