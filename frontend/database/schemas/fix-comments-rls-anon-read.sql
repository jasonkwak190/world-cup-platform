-- ================================================
-- 🔧 댓글 RLS 정책 수정 - anon 사용자 읽기 허용
-- ================================================
-- RLS로 인한 댓글 로딩 타임아웃 문제 해결

-- 1. 기존 읽기 정책 삭제
DROP POLICY IF EXISTS "Anyone can read non-deleted comments" ON comments;

-- 2. 새로운 읽기 정책 생성 - anon 역할에도 명시적으로 허용
CREATE POLICY "Everyone can read non-deleted comments" ON comments
    FOR SELECT 
    TO public, authenticated, anon
    USING (is_deleted = false OR is_deleted IS NULL);

-- 3. 기존 생성 정책 수정 - anon 사용자 허용
DROP POLICY IF EXISTS "Authenticated users can create own comments" ON comments;

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT 
    TO public, authenticated, anon
    WITH CHECK (
        -- 인증된 사용자는 본인 댓글만
        (auth.uid() IS NOT NULL AND auth.uid() = author_id) OR
        -- 비인증 사용자(anon)는 author_id가 null인 게스트 댓글만
        (auth.uid() IS NULL AND author_id IS NULL)
    );

-- 4. 수정 정책 유지 (인증된 사용자만)
-- 기존 정책 그대로 유지

-- 5. 삭제 정책 유지 (인증된 사용자만)  
-- 기존 정책 그대로 유지

-- 6. 정책 확인
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

-- 7. anon 역할로 테스트 쿼리
SET ROLE anon;
SELECT 
    COUNT(*) as total_comments_as_anon
FROM comments
WHERE is_deleted = false OR is_deleted IS NULL;

-- 8. 원래 역할로 복구
RESET ROLE;

-- 9. 최종 테스트 쿼리
SELECT 
    COUNT(*) as total_comments,
    COUNT(CASE WHEN author_id IS NOT NULL THEN 1 END) as member_comments,
    COUNT(CASE WHEN author_id IS NULL THEN 1 END) as guest_comments
FROM comments
WHERE is_deleted = false OR is_deleted IS NULL;

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '🔧 댓글 RLS 정책 수정 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '수정사항:';
    RAISE NOTICE '- 읽기: public, authenticated, anon 모든 역할 허용';
    RAISE NOTICE '- 생성: 회원/비회원 모두 허용 (적절한 체크와 함께)';
    RAISE NOTICE '- 수정/삭제: 인증된 사용자만 (기존 정책 유지)';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ anon 사용자도 댓글 읽기 가능';
    RAISE NOTICE '================================================';
END $$;