import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimiters, checkRateLimit, getUserIdentifier } from '@/lib/ratelimit';

// 🔒 SECURITY: 서버측 비밀번호 정책 검증 함수
function validatePasswordPolicy(password: string): { isValid: boolean; error: string } {
  if (password.length < 8) {
    return { isValid: false, error: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: '비밀번호에 소문자가 포함되어야 합니다.' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: '비밀번호에 대문자가 포함되어야 합니다.' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: '비밀번호에 숫자가 포함되어야 합니다.' };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: '비밀번호에 특수문자가 포함되어야 합니다.' };
  }
  
  if (/(.)\1\1/.test(password)) {
    return { isValid: false, error: '같은 문자를 3번 이상 연속으로 사용할 수 없습니다.' };
  }
  
  const weakPatterns = [
    /^password/i, /^123456/, /^qwerty/i, /^admin/i, /^user/i,
    /^abc123/i, /^111111/, /^000000/, /^qazwsx/i
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return { isValid: false, error: '너무 일반적인 비밀번호입니다. 다른 비밀번호를 사용해주세요.' };
    }
  }
  
  return { isValid: true, error: '' };
}

export async function POST(request: NextRequest) {
  try {
    // 🔒 SECURITY: 엄격한 Rate Limiting 적용 (OTP 브루트포스 방지)
    const identifier = getUserIdentifier(request);
    const rateLimitResult = await checkRateLimit(rateLimiters.auth, identifier);
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many password reset attempts. Please wait before trying again.',
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
    const { email, otpCode, newPassword } = body;

    // 입력값 검증
    if (!email || !otpCode || !newPassword) {
      return NextResponse.json(
        { success: false, error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: 강화된 비밀번호 정책 서버측 검증
    const passwordValidation = validatePasswordPolicy(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      );
    }

    // 1. OTP 검증
    const { data: otpData, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otpCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpData) {
      console.error('OTP 검증 실패:', otpError);
      return NextResponse.json(
        { success: false, error: '인증번호가 잘못되었거나 만료되었습니다.' },
        { status: 400 }
      );
    }

    // 2. 해당 이메일의 사용자 ID 찾기
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('사용자 조회 오류:', authError);
      return NextResponse.json(
        { success: false, error: '사용자 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const targetUser = authUsers.users.find(user => user.email === email);
    
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 3. Supabase Auth로 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      { 
        password: newPassword 
      }
    );

    if (updateError) {
      console.error('비밀번호 업데이트 오류:', updateError);
      return NextResponse.json(
        { success: false, error: '비밀번호 변경 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 4. OTP를 사용됨으로 표시
    const { error: markUsedError } = await supabase
      .from('password_reset_otps')
      .update({ used: true, updated_at: new Date().toISOString() })
      .eq('id', otpData.id);

    if (markUsedError) {
      console.error('OTP 사용 표시 오류:', markUsedError);
      // 비밀번호는 이미 변경되었으므로 에러를 반환하지 않음
    }

    // 5. 해당 이메일의 모든 미사용 OTP 삭제 (보안)
    const { error: cleanupError } = await supabase
      .from('password_reset_otps')
      .delete()
      .eq('email', email)
      .eq('used', false);

    if (cleanupError) {
      console.error('OTP 정리 오류:', cleanupError);
    }

    console.log(`✅ 비밀번호 변경 완료 - ${email}`);

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.'
    });

  } catch (error) {
    console.error('비밀번호 리셋 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}