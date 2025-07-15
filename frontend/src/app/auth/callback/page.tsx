'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { SupabaseUser } from '@/types/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 세션 정보 가져오기
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError('인증 처리 중 오류가 발생했습니다.');
          return;
        }

        if (!data.session) {
          console.error('No session found in callback');
          setError('로그인 세션을 찾을 수 없습니다.');
          return;
        }

        const user = data.session.user;
        console.log('✅ OAuth success, user:', user);

        // users 테이블에 사용자 정보 저장/업데이트
        const userData = {
          id: user.id,
          email: user.email || '',
          username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Google 사용자',
          provider: 'google',
          provider_id: user.id,
          avatar_url: user.user_metadata?.avatar_url || null,
          google_email: user.email || '',
          is_migrated: true,
          supabase_auth_id: user.id,
          role: 'user' as const,
        };

        // upsert를 사용하여 기존 사용자 업데이트 또는 새 사용자 생성
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .upsert(userData, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (userError) {
          console.error('User record upsert error:', userError);
          // 사용자 레코드 생성/업데이트 실패해도 로그인은 성공으로 처리
        }

        console.log('✅ User record updated:', userRecord);

        // 성공적으로 처리되면 홈으로 리다이렉트
        router.push('/');
        
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        setError('로그인 처리 중 예상치 못한 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인 처리 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인 오류</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}