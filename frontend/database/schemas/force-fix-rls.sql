-- ================================================
-- 🔧 강력한 RLS 정책 수정
-- ================================================

-- 모든 기존 정책 제거
DROP POLICY IF EXISTS "Public read access to interactions" ON user_interactions;
DROP POLICY IF EXISTS "Anyone can view interactions" ON user_interactions;
DROP POLICY IF EXISTS "Anonymous users can view interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can insert own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can update own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can delete own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Users can manage own interactions" ON user_interactions;

-- RLS 일시 비활성화
ALTER TABLE user_interactions DISABLE ROW LEVEL SECURITY;

-- 명시적 권한 부여
GRANT ALL ON user_interactions TO anon;
GRANT ALL ON user_interactions TO authenticated;
GRANT ALL ON user_interactions TO public;

-- RLS 다시 활성화
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- 매우 관대한 정책 생성
CREATE POLICY "allow_all_select" ON user_interactions FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON user_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON user_interactions FOR UPDATE USING (true);
CREATE POLICY "allow_all_delete" ON user_interactions FOR DELETE USING (true);

-- 정책 확인
SELECT 
    schemaname,
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

-- 권한 확인
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_interactions'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_interactions';

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '🔧 강력한 RLS 정책 수정 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '변경사항:';
    RAISE NOTICE '- 모든 기존 정책 제거';
    RAISE NOTICE '- anon, authenticated, public에 모든 권한 부여';
    RAISE NOTICE '- 매우 관대한 정책 (모든 작업 허용)';
    RAISE NOTICE '================================================';
END $$;