// Supabase 클라이언트 설정
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL과 Anonymous Key가 환경변수에 설정되지 않았습니다.');
}

// 클라이언트용 Supabase 인스턴스
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'User-Agent': 'worldcup-platform/1.0'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// 서버용 Supabase 인스턴스 (Service Role Key 사용) - 서버에서만 사용
let supabaseAdmin: any = null;

// 서버 환경에서만 Admin 클라이언트 생성
if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// 연결 테스트 함수
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Supabase 연결 실패:', error);
      return false;
    }
    
    console.log('Supabase 연결 성공!');
    return true;
  } catch (error) {
    console.error('Supabase 연결 오류:', error);
    return false;
  }
}

// Admin 전용 사용자 생성 함수 - 서버에서만 사용
export async function createUserWithAdmin(email: string, password: string, userData: any) {
  if (!supabaseAdmin) {
    return { 
      data: null, 
      error: { message: 'Admin client not available on client side' } 
    };
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userData
    });
    
    return { data, error };
  } catch (error) {
    console.error('Admin user creation error:', error);
    return { data: null, error };
  }
}