-- ================================================
-- 🔒 안전한 댓글 RLS 정책 복구
-- ================================================
-- 현재 잘 작동하는 상태에서 보안만 추가

-- 1. 댓글 테이블 RLS 다시 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 2. 안전한 정책들 생성
-- 📖 읽기: 모든 사용자가 삭제되지 않은 댓글을 볼 수 있음
CREATE POLICY "Anyone can read non-deleted comments" ON comments
    FOR SELECT USING (is_deleted = false OR is_deleted IS NULL);

-- ✏️ 생성: 인증된 사용자는 본인 댓글 생성, 비인증 사용자는 게스트 댓글 생성
CREATE POLICY "Authenticated users can create own comments" ON comments
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = author_id) OR
        (auth.uid() IS NULL AND author_id IS NULL)
    );

-- 🔧 수정: 인증된 사용자는 본인의 댓글만 수정 가능
CREATE POLICY "Users can update own comments only" ON comments
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = author_id AND 
        author_id IS NOT NULL
    );

-- 🗑️ 삭제: 인증된 사용자는 본인의 댓글만 삭제 가능
CREATE POLICY "Users can delete own comments only" ON comments
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND 
        auth.uid() = author_id AND 
        author_id IS NOT NULL
    );

-- 3. 정책 확인
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

-- 4. RLS 상태 확인
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'comments';

-- 5. 테스트 쿼리 (읽기는 계속 작동해야 함)
SELECT 
    COUNT(*) as total_comments,
    COUNT(CASE WHEN author_id IS NOT NULL THEN 1 END) as member_comments,
    COUNT(CASE WHEN author_id IS NULL THEN 1 END) as guest_comments
FROM comments
WHERE is_deleted = false OR is_deleted IS NULL;

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '🔒 안전한 댓글 RLS 정책 복구 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '보안 정책:';
    RAISE NOTICE '- 읽기: 모든 사용자 (삭제되지 않은 댓글만)';
    RAISE NOTICE '- 생성: 본인 댓글만 (회원/비회원 구분)';
    RAISE NOTICE '- 수정: 인증된 사용자의 본인 댓글만';
    RAISE NOTICE '- 삭제: 인증된 사용자의 본인 댓글만';
    RAISE NOTICE '================================================';
    RAISE NOTICE '⚠️ 게스트 댓글 삭제는 클라이언트 로직으로 처리';
    RAISE NOTICE '================================================';
END $$;