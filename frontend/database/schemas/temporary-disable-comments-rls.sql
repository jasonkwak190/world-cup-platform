-- ================================================
-- ⚠️ 임시 테스트: 댓글 RLS 완전 비활성화
-- ================================================
-- 주의: 이는 테스트용입니다. 운영에서는 적절한 RLS 정책이 필요합니다.

-- 1. 댓글 테이블 RLS 비활성화
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 2. 모든 기존 정책 제거
DROP POLICY IF EXISTS "Allow all users to read comments" ON comments;
DROP POLICY IF EXISTS "Allow authenticated users to insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Enable read access for comments" ON comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;

-- 3. 확인
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

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '⚠️ 댓글 RLS 임시 비활성화 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '주의: 이는 테스트용입니다.';
    RAISE NOTICE '문제 해결 후 다시 RLS를 활성화하세요.';
    RAISE NOTICE '================================================';
END $$;