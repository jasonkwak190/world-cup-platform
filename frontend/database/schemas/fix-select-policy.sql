-- ================================================
-- 🔧 SELECT 정책 수정 - user_interactions
-- ================================================
-- SELECT 권한 문제 해결

-- 현재 정책 상태 확인
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'user_interactions';

-- 기존 SELECT 정책 제거
DROP POLICY IF EXISTS "Anyone can view interactions" ON user_interactions;
DROP POLICY IF EXISTS "Anonymous users can view interactions" ON user_interactions;

-- 새로운 SELECT 정책 - 더 관대하게
CREATE POLICY "Public read access to interactions" ON user_interactions
    FOR SELECT TO public USING (true);

-- 또는 인증된 사용자만 허용하려면:
-- CREATE POLICY "Authenticated users can view interactions" ON user_interactions
--     FOR SELECT TO authenticated USING (true);

-- anon 역할에 대한 명시적 권한 부여
GRANT SELECT ON user_interactions TO anon;
GRANT SELECT ON user_interactions TO authenticated;

-- 정책 적용 확인
SELECT 
    policyname, 
    cmd, 
    permissive,
    roles,
    qual 
FROM pg_policies 
WHERE tablename = 'user_interactions'
ORDER BY cmd;

-- 테이블 권한 확인
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'user_interactions'
AND table_schema = 'public';

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ SELECT 정책 수정 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '변경사항:';
    RAISE NOTICE '- SELECT: public 역할에 대해 true (모든 접근 허용)';
    RAISE NOTICE '- anon 및 authenticated 역할에 명시적 SELECT 권한 부여';
    RAISE NOTICE '================================================';
END $$;