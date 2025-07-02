-- ================================================
-- 🔧 강력한 RLS 정책 수정 (수정된 버전)
-- ================================================

-- 1단계: 기존 정책들 하나씩 제거
DO $$
BEGIN
    -- 모든 기존 정책 제거 (오류 무시)
    DROP POLICY IF EXISTS "Public read access to interactions" ON user_interactions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy "Public read access to interactions" does not exist';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view interactions" ON user_interactions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy "Anyone can view interactions" does not exist';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Anonymous users can view interactions" ON user_interactions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy "Anonymous users can view interactions" does not exist';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert own interactions" ON user_interactions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy "Users can insert own interactions" does not exist';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own interactions" ON user_interactions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy "Users can update own interactions" does not exist';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own interactions" ON user_interactions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy "Users can delete own interactions" does not exist';
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage own interactions" ON user_interactions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy "Users can manage own interactions" does not exist';
END $$;

-- 2단계: RLS 일시 비활성화 후 권한 부여
ALTER TABLE user_interactions DISABLE ROW LEVEL SECURITY;

-- 명시적 권한 부여
GRANT ALL ON user_interactions TO anon;
GRANT ALL ON user_interactions TO authenticated;
GRANT ALL ON user_interactions TO public;

-- 3단계: RLS 다시 활성화
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- 4단계: 매우 관대한 정책 생성
CREATE POLICY "allow_all_select" ON user_interactions FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON user_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON user_interactions FOR UPDATE USING (true);
CREATE POLICY "allow_all_delete" ON user_interactions FOR DELETE USING (true);

-- 5단계: 정책 확인
SELECT 
    'RLS 정책 확인' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'user_interactions'
ORDER BY cmd, policyname;

-- 권한 확인
SELECT 
    '테이블 권한 확인' as check_type,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'user_interactions'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- RLS 상태 확인
SELECT 
    'RLS 상태 확인' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_interactions';

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ 강력한 RLS 정책 수정 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '변경사항:';
    RAISE NOTICE '- 모든 기존 정책 제거';
    RAISE NOTICE '- anon, authenticated, public에 모든 권한 부여';
    RAISE NOTICE '- 매우 관대한 정책 (모든 작업 허용)';
    RAISE NOTICE '- SELECT, INSERT, UPDATE, DELETE 모두 허용';
    RAISE NOTICE '================================================';
    RAISE NOTICE '이제 댓글 좋아요 기능을 테스트해보세요!';
    RAISE NOTICE '================================================';
END $$;