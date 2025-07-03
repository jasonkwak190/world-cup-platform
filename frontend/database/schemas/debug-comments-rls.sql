-- ================================================
-- 🔍 댓글 테이블 RLS 정책 디버깅
-- ================================================

-- 1. 현재 RLS 정책 확인
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
WHERE tablename = 'comments'
ORDER BY cmd, policyname;

-- 2. RLS 활성화 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    relowner
FROM pg_tables 
WHERE tablename = 'comments';

-- 3. 현재 사용자 권한 확인
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- 4. 인증 상태 확인 (Supabase auth)
SELECT 
    auth.uid() as authenticated_user_id,
    auth.role() as auth_role;

-- 5. 댓글 테이블 구조 확인
\d comments;

-- 6. 샘플 댓글 조회 테스트
SELECT 
    id,
    worldcup_id,
    author_id,
    guest_name,
    content,
    created_at,
    is_deleted
FROM comments 
WHERE worldcup_id = '61b11d69-bbe0-4daf-aabc-003b893f3129'
LIMIT 5;

-- 7. RLS 없이 조회 테스트 (관리자 권한)
SET row_security = off;
SELECT COUNT(*) as total_comments_without_rls FROM comments;
SET row_security = on;

-- 8. RLS 정책별 테스트
SELECT 'Testing RLS policies...' as status;

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '🔍 댓글 RLS 디버깅 결과';
    RAISE NOTICE '================================================';
    RAISE NOTICE '위 쿼리 결과를 확인하여 문제점을 파악하세요.';
    RAISE NOTICE '================================================';
END $$;