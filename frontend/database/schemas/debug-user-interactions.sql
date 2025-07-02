-- ================================================
-- 🔍 user_interactions 테이블 디버깅 쿼리
-- ================================================

-- 1. 테이블 존재 확인
SELECT 
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_interactions'
    ) as table_exists;

-- 2. 컬럼 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_interactions'
ORDER BY ordinal_position;

-- 3. RLS 정책 확인
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_interactions';

-- 4. 현재 데이터 확인
SELECT 
    target_type,
    interaction_type,
    COUNT(*) as count
FROM user_interactions 
GROUP BY target_type, interaction_type
ORDER BY target_type, interaction_type;

-- 5. 특정 사용자의 상호작용 확인 (테스트용)
-- SELECT * FROM user_interactions 
-- WHERE user_id = 'fa03a2e1-6c77-4c5b-a4e2-18f974a00728' 
-- LIMIT 10;

-- 6. 댓글 좋아요 테스트 쿼리
-- SELECT * FROM user_interactions 
-- WHERE target_type = 'comment' 
-- AND interaction_type = 'like' 
-- LIMIT 10;