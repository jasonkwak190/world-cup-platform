import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendOTPEmail } from '@/lib/email';
import { rateLimiters, checkRateLimit, getUserIdentifier } from '@/lib/ratelimit';

// OTP 생성 함수 (6자리 랜덤 숫자)
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 SECURITY: 엄격한 Rate Limiting 적용 (이메일 스팸 방지)
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.auth, identifier);
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many OTP requests. Please wait before trying again.',
          retryAfter: rateLimitResult.retryAfter || 60
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

    const body = await request.json();
    const { email } = body;

    // 이메일 유효성 검사
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: '유효한 이메일 주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 1. 해당 이메일의 사용자가 존재하는지 확인 (Supabase Auth)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('사용자 조회 오류:', authError);
      return NextResponse.json(
        { success: false, error: '사용자 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const userExists = authUsers.users.some(user => user.email === email);
    
    if (!userExists) {
      // 보안상 존재하지 않는 이메일이어도 성공 메시지 표시
      return NextResponse.json({
        success: true,
        message: '인증번호가 이메일로 발송되었습니다. (가입된 이메일인 경우에만 수신됩니다)'
      });
    }

    // 2. 기존 미사용 OTP 삭제 (같은 이메일)
    const { error: deleteError } = await supabase
      .from('password_reset_otps')
      .delete()
      .eq('email', email)
      .eq('used', false);

    if (deleteError) {
      console.error('기존 OTP 삭제 오류:', deleteError);
    }

    // 3. 새 OTP 생성
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    // 4. OTP 데이터베이스에 저장
    const { error: insertError } = await supabase
      .from('password_reset_otps')
      .insert({
        email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (insertError) {
      console.error('OTP 저장 오류:', insertError);
      return NextResponse.json(
        { success: false, error: 'OTP 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 5. 이메일 발송
    const emailResult = await sendOTPEmail(email, otpCode);
    
    if (!emailResult.success) {
      // 이메일 발송 실패해도 사용자에게는 성공 메시지 (보안)
      console.error('이메일 발송 실패:', emailResult.error, 'OTP:', otpCode);
    }

    console.log(`✅ OTP 생성 완료 - ${email}: ${otpCode} (만료: ${expiresAt})`);

    return NextResponse.json({
      success: true,
      message: '인증번호가 이메일로 발송되었습니다. 10분 내에 입력해주세요.',
      // 개발용으로 OTP 코드 포함 (실제 환경에서는 제거)
      ...(process.env.NODE_ENV === 'development' && { otpCode })
    });

  } catch (error) {
    console.error('OTP 발송 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}