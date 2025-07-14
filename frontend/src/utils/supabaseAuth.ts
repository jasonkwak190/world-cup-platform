// Supabase 인증 관련 유틸리티 함수
import { supabase } from '@/lib/supabase';
import type { SupabaseUser, SupabaseUserInsert, SupabaseUserUpdate } from '@/types/supabase';

// 회원가입
export async function signUpWithSupabase(signupData: { email: string; password: string; username: string }) {
  try {
    // 1. Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        data: {
          username: signupData.username,
        }
      }
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: '사용자 생성에 실패했습니다.' };
    }

    // 2. users 테이블에 추가 정보 저장
    const userData: SupabaseUserInsert = {
      id: authData.user.id,
      username: signupData.username,
      email: signupData.email,
      role: 'user'
    };

    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) {
      // 인증 사용자 삭제 (실패 시)
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: userError.message };
    }

    return { success: true, user: userRecord };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
  }
}

// 로그인
export async function signInWithSupabase(loginData: { email: string; password: string }) {
  try {
    console.log('🔐 Starting Supabase auth with:', loginData.email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password
    });

    console.log('🔐 Auth response received:', { 
      hasUser: !!data?.user, 
      hasSession: !!data?.session,
      error: error?.message 
    });

    if (error) {
      console.error('❌ Auth error:', error);
      // 로그인 에러 메시지를 한국어로 변환
      let errorMessage = '로그인에 실패했습니다.';
      
      if (error.message === 'Invalid login credentials') {
        errorMessage = '아이디나 비밀번호가 잘못되었습니다.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증이 완료되지 않았습니다.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.';
      }
      
      return { success: false, error: errorMessage };
    }

    if (!data.user) {
      console.error('❌ No user in auth response');
      return { success: false, error: '로그인에 실패했습니다.' };
    }

    if (!data.session) {
      console.error('❌ No session in auth response');
      return { success: false, error: '세션 생성에 실패했습니다.' };
    }

    console.log('✅ Auth successful, user ID:', data.user.id);

    // 세션은 이미 signInWithPassword에서 자동 설정됨 - 별도 설정 불필요
    console.log('🔄 Session already set by signInWithPassword');

    // users 테이블에서 추가 정보 가져오기
    console.log('🔍 Fetching user data from users table...');
    
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (userError) {
      console.error('❌ Users table fetch error:', userError);
    }

    if (userRecord) {
      console.log('✅ Found user in users table:', userRecord);
      return { success: true, user: userRecord };
    }

    // users 테이블 조회 실패시 auth 정보로 기본 사용자 객체 생성
    console.log('🔄 Using fallback user data...');
    const fallbackUser = {
      id: data.user.id,
      email: data.user.email || '',
      username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || '사용자',
      role: 'user' as 'user' | 'admin',
      created_at: data.user.created_at,
      updated_at: data.user.updated_at,
      profile_image_url: null
    };

    // 🔒 SECURITY: 역할은 데이터베이스에서만 관리되어야 함
    // 클라이언트 측에서 역할을 결정하지 않음

    console.log('✅ Fallback user created:', fallbackUser);
    return { success: true, user: fallbackUser };
    
  } catch (error) {
    console.error('❌ Unexpected login error:', error);
    return { success: false, error: '로그인 중 예상치 못한 오류가 발생했습니다.' };
  }
}

// 로그아웃
export async function signOutFromSupabase() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: '로그아웃 중 오류가 발생했습니다.' };
  }
}

// 현재 사용자 가져오기
export async function getCurrentSupabaseUser(): Promise<SupabaseUser | null> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return null;
    }

    // 세션이 있는지 확인
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No active session found');
      return null;
    }

    // users 테이블에서 조회 시도 (maybeSingle 사용)
    const { data: userRecord, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user from table:', error);
    }

    // users 테이블에 데이터가 있으면 반환, 없으면 fallback 사용
    if (userRecord) {
      return userRecord;
    }

    // fallback: auth 정보로 기본 사용자 객체 생성
    console.log('Using fallback user data for:', authUser.email);
    const fallbackUser = {
      id: authUser.id,
      email: authUser.email || '',
      username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || '사용자',
      role: 'user' as 'user' | 'admin',
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
      profile_image_url: null
    };

    // 🔒 SECURITY: 역할은 데이터베이스에서만 관리되어야 함
    // 클라이언트 측에서 역할을 결정하지 않음

    return fallbackUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// 사용자 프로필 업데이트
export async function updateSupabaseUserProfile(userId: string, updates: SupabaseUserUpdate) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: '프로필 업데이트 중 오류가 발생했습니다.' };
  }
}

// 🔥 새로운 Custom OTP 시스템 - 인증번호 발송
export async function sendPasswordResetOTP(email: string) {
  try {
    const response = await fetch('/api/auth/send-reset-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error || '인증번호 발송에 실패했습니다.' };
    }

    return { 
      success: true, 
      message: result.message || '인증번호가 이메일로 발송되었습니다.'
      // 🔒 SECURITY: OTP 코드는 절대 클라이언트에 노출되지 않음
    };
  } catch (error) {
    console.error('OTP send error:', error);
    return { success: false, error: '인증번호 발송 중 오류가 발생했습니다.' };
  }
}

// 🔥 새로운 Custom OTP 시스템 - 인증번호 검증 및 비밀번호 변경
export async function resetPasswordWithOTP(email: string, otp: string, newPassword: string) {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        otpCode: otp, 
        newPassword 
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error || '비밀번호 변경에 실패했습니다.' };
    }

    return { 
      success: true, 
      message: result.message || '비밀번호가 성공적으로 변경되었습니다.' 
    };
  } catch (error) {
    console.error('Password reset with OTP error:', error);
    return { success: false, error: '비밀번호 변경 중 오류가 발생했습니다.' };
  }
}

// 세션 변경 감지
export function onAuthStateChange(callback: (user: SupabaseUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentSupabaseUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}