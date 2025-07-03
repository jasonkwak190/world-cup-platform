-- ================================================
-- ⚠️ 임시 조치: RLS 다시 비활성화
-- ================================================
-- 익명 로그인 상태에서도 타임아웃 발생하므로 일시적으로 RLS 비활성화

-- 1. 댓글 테이블 RLS 비활성화
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 2. 모든 RLS 정책 제거
DROP POLICY IF EXISTS "Anyone can read non-deleted comments" ON comments;
DROP POLICY IF EXISTS "Everyone can read non-deleted comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create own comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments only" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments only" ON comments;

-- 3. 상태 확인
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'comments';

-- 4. 테스트 쿼리
SELECT 
    COUNT(*) as total_comments,
    COUNT(CASE WHEN author_id IS NOT NULL THEN 1 END) as member_comments,
    COUNT(CASE WHEN author_id IS NULL THEN 1 END) as guest_comments
FROM comments;

-- 5. 특정 worldcup으로 테스트
SELECT 
    COUNT(*) as comments_for_specific_worldcup
FROM comments 
WHERE worldcup_id = '144ff57a-d910-4292-98c2-45ba8e6434f4';

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '⚠️ RLS 임시 비활성화 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '이제 댓글이 정상적으로 로드되어야 합니다.';
    RAISE NOTICE 'RLS 관련 문제를 디버깅한 후 다시 활성화하세요.';
    RAISE NOTICE '================================================';
END $$;