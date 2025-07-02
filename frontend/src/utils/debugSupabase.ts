// 임시 Supabase 디버깅 유틸리티
import { supabase } from '@/lib/supabase';

export async function debugUserInteractions() {
  console.log('🔍 Supabase 디버깅 시작...');
  
  try {
    // 1. 기본 연결 테스트
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    console.log('✅ Supabase 기본 연결:', testError ? '실패' : '성공');
    if (testError) console.error('연결 오류:', testError);
    
    // 2. user_interactions 테이블 존재 확인
    const { data: tableData, error: tableError } = await supabase
      .from('user_interactions')
      .select('count')
      .limit(1);
      
    console.log('✅ user_interactions 테이블:', tableError ? '접근 불가' : '접근 가능');
    if (tableError) console.error('테이블 오류:', tableError);
    
    // 3. 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 현재 사용자:', user ? user.id : '비로그인');
    if (userError) console.error('사용자 오류:', userError);
    
    // 4. 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔑 세션 상태:', session ? '활성' : '비활성');
    if (sessionError) console.error('세션 오류:', sessionError);
    
    // 5. API 키 확인
    console.log('🔐 API URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('🔐 API Key 존재:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    return {
      connection: !testError,
      table: !tableError,
      user: user?.id || null,
      session: !!session
    };
    
  } catch (error) {
    console.error('🚨 디버깅 중 오류:', error);
    return null;
  }
}

export async function testUserInteractionQuery(userId: string, commentId: string) {
  console.log('🧪 user_interactions 쿼리 테스트...');
  
  try {
    const { data, error } = await supabase
      .from('user_interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .eq('interaction_type', 'like')
      .single();
      
    console.log('📊 쿼리 결과:', { data, error });
    
    if (error) {
      console.error('❌ 쿼리 오류 상세:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    }
    
    return { data, error };
  } catch (error) {
    console.error('🚨 쿼리 테스트 중 오류:', error);
    return { data: null, error };
  }
}