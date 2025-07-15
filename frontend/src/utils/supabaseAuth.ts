// Supabase 인증 관련 유틸리티 함수
import { supabase } from '@/lib/supabase';
import type { SupabaseUser, SupabaseUserInsert, SupabaseUserUpdate } from '@/types/supabase';

// Google OAuth 로그인 - Supabase에서 자동 처리

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