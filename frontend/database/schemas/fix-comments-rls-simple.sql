-- ================================================
-- 🔧 댓글 로딩 문제 해결을 위한 간단한 RLS 정책
-- ================================================

-- 1. 기존 comments 테이블 정책 모두 제거
DROP POLICY IF EXISTS "Enable read access for comments" ON comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Public comments are viewable" ON comments;

-- 2. 매우 간단한 읽기 정책 생성 - 모든 사용자가 모든 댓글을 볼 수 있음
CREATE POLICY "Allow all users to read comments" ON comments
    FOR SELECT USING (true);

-- 3. 댓글 작성 정책 (회원/비회원 구분)
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
DROP POLICY IF EXISTS "Allow comment creation" ON comments;

CREATE POLICY "Allow authenticated users to insert comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = author_id OR author_id IS NULL);

-- 4. 댓글 수정 정책 (본인만)
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = author_id AND author_id IS NOT NULL);

-- 5. 댓글 삭제 정책 (본인만)
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid() = author_id AND author_id IS NOT NULL);

-- 6. RLS 활성화 확인
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 7. 정책 확인
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'comments'
ORDER BY cmd, policyname;

-- 8. 테스트 쿼리
SELECT 'Testing comment access...' as status;

SELECT 
    COUNT(*) as total_comments,
    COUNT(CASE WHEN author_id IS NOT NULL THEN 1 END) as member_comments,
    COUNT(CASE WHEN author_id IS NULL THEN 1 END) as guest_comments
FROM comments;

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ 댓글 RLS 정책 간소화 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '변경사항:';
    RAISE NOTICE '- SELECT: 모든 사용자가 모든 댓글 읽기 가능';
    RAISE NOTICE '- INSERT: 인증된 사용자 본인 댓글 + 비회원 댓글 허용';
    RAISE NOTICE '- UPDATE: 인증된 사용자 본인 댓글만';
    RAISE NOTICE '- DELETE: 인증된 사용자 본인 댓글만';
    RAISE NOTICE '================================================';
END $$;