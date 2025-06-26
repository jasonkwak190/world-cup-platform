// Supabase 인증 관련 유틸리티 함수
import { supabase } from '@/lib/supabase';
import type { SupabaseUser, SupabaseUserInsert, SupabaseUserUpdate } from '@/types/supabase';

// 회원가입
export async function signUpWithSupabase(email: string, password: string, username: string) {
  try {
    // 1. Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
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
      username,
      email,
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
export async function signInWithSupabase(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: '로그인에 실패했습니다.' };
    }

    // users 테이블에서 추가 정보 가져오기
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      return { success: false, error: '사용자 정보를 불러올 수 없습니다.' };
    }

    return { success: true, user: userRecord };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: '로그인 중 오류가 발생했습니다.' };
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

    const { data: userRecord, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return userRecord;
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