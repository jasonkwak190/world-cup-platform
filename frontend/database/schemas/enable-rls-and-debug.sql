-- ================================================
-- 🔧 RLS 재활성화 및 디버깅
-- ================================================

-- RLS 다시 활성화
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- 현재 RLS 정책 상태 확인
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_interactions'
ORDER BY cmd, policyname;

-- 테이블 권한 확인
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'user_interactions'
AND table_schema = 'public';

-- 간단한 SELECT 권한 테스트
SELECT 'SELECT 권한 테스트' as test_name;
SELECT COUNT(*) as total_interactions FROM user_interactions;

-- auth 함수들 테스트
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    current_user as postgres_user;

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '🔍 RLS 디버깅 정보';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'RLS가 다시 활성화되었습니다.';
    RAISE NOTICE '위의 쿼리 결과를 확인하여 권한 문제를 파악하세요.';
    RAISE NOTICE '================================================';
END $$;