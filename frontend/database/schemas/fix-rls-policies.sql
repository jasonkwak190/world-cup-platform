-- ================================================
-- 🔧 RLS 정책 수정 - user_interactions 테이블
-- ================================================
-- 406 오류 해결을 위한 RLS 정책 수정

-- 기존 정책 제거
DROP POLICY IF EXISTS "Users can manage own interactions" ON user_interactions;
DROP POLICY IF EXISTS "Anyone can view interactions" ON user_interactions;

-- 새로운 정책 생성 - 더 관대한 접근 허용
CREATE POLICY "Anyone can view interactions" ON user_interactions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own interactions" ON user_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions" ON user_interactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions" ON user_interactions
    FOR DELETE USING (auth.uid() = user_id);

-- 비회원 사용자를 위한 추가 정책 (필요시)
CREATE POLICY "Anonymous users can view interactions" ON user_interactions
    FOR SELECT USING (true);

-- RLS 정책 확인
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_interactions'
ORDER BY cmd, policyname;

-- 테스트 쿼리
SELECT 'RLS 정책 적용 후 테스트' as message;

-- 현재 인증된 사용자 확인
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ RLS 정책 수정 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '변경사항:';
    RAISE NOTICE '- SELECT: 모든 사용자 허용 (true)';
    RAISE NOTICE '- INSERT: 본인 데이터만 (auth.uid() = user_id)';
    RAISE NOTICE '- UPDATE: 본인 데이터만 (auth.uid() = user_id)';
    RAISE NOTICE '- DELETE: 본인 데이터만 (auth.uid() = user_id)';
    RAISE NOTICE '================================================';
END $$;