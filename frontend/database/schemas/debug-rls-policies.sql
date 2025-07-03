-- ================================================
-- 🔍 RLS 정책 디버깅 - 익명 로그인 상태 문제 분석
-- ================================================

-- 1. 현재 RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    relowner
FROM pg_tables 
WHERE tablename = 'comments';

-- 2. 현재 활성화된 모든 정책 확인
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

-- 3. 현재 사용자 역할 확인
SELECT 
    current_user,
    current_setting('role') as current_role,
    session_user;

-- 4. auth.uid() 함수 테스트
SELECT 
    auth.uid() as current_auth_uid,
    auth.jwt() as current_jwt;

-- 5. 댓글 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'comments'
ORDER BY ordinal_position;

-- 6. 댓글 샘플 데이터 확인 (RLS 우회하여)
SELECT 
    id,
    worldcup_id,
    author_id,
    guest_name,
    content,
    is_deleted,
    created_at
FROM comments 
LIMIT 5;

-- 7. 특정 worldcup_id로 직접 쿼리 테스트
-- (실제 worldcup_id로 교체 필요)
SELECT 
    COUNT(*) as total_for_worldcup
FROM comments 
WHERE worldcup_id = '144ff57a-d910-4292-98c2-45ba8e6434f4';

-- 8. is_deleted 필드 상태 확인
SELECT 
    is_deleted,
    COUNT(*) as count
FROM comments 
GROUP BY is_deleted;

-- 9. RLS 정책 개별 테스트
-- 읽기 정책 테스트
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM comments 
WHERE is_deleted = false OR is_deleted IS NULL
LIMIT 10;

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '🔍 RLS 정책 디버깅 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '위 결과를 확인하여 문제점을 파악하세요:';
    RAISE NOTICE '1. RLS 활성화 상태';
    RAISE NOTICE '2. 현재 정책들';
    RAISE NOTICE '3. 사용자 역할';
    RAISE NOTICE '4. auth.uid() 값';
    RAISE NOTICE '5. 데이터 존재 여부';
    RAISE NOTICE '================================================';
END $$;