// 이메일 발송 유틸리티
// Resend 서비스를 사용한 이메일 발송

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * OTP 이메일 템플릿 생성
 */
export function createOTPEmailTemplate(otpCode: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>비밀번호 재설정 인증번호</title>
      <style>
        body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: white; border: 2px solid #10B981; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #10B981; letter-spacing: 8px; }
        .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #6B7280; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏆 월드컵 플랫폼</h1>
          <p>비밀번호 재설정 인증번호</p>
        </div>
        
        <div class="content">
          <h2>안녕하세요!</h2>
          <p>비밀번호 재설정을 위한 인증번호를 요청하셨습니다.</p>
          
          <div class="otp-box">
            <p>인증번호</p>
            <div class="otp-code">${otpCode}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ 중요 안내</strong>
            <ul>
              <li>이 인증번호는 <strong>10분간</strong> 유효합니다.</li>
              <li>인증번호를 타인과 공유하지 마세요.</li>
              <li>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.</li>
            </ul>
          </div>
          
          <p>문의사항이 있으시면 고객센터로 연락주세요.</p>
        </div>
        
        <div class="footer">
          <p>© 2024 월드컵 플랫폼. All rights reserved.</p>
          <p>이 이메일은 자동으로 발송된 메일입니다.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 이메일 발송 함수 (Resend 사용)
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // 개발 환경에서는 콘솔 로그
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 이메일 발송 (개발 모드)');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.html.substring(0, 200) + '...');
      return { success: true };
    }

    // Resend API 키 확인
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY가 설정되지 않았습니다.');
      return { success: false, error: '이메일 서비스 설정 오류' };
    }

    // Resend 라이브러리 동적 import
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 이메일 발송
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@worldcup-platform.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Resend 이메일 발송 실패:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ 이메일 발송 성공:', data?.id);
    return { success: true };

  } catch (error) {
    console.error('이메일 발송 오류:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * OTP 이메일 발송
 */
export async function sendOTPEmail(email: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
  const emailOptions: EmailOptions = {
    to: email,
    subject: '[월드컵 플랫폼] 비밀번호 재설정 인증번호',
    html: createOTPEmailTemplate(otpCode)
  };

  return await sendEmail(emailOptions);
}