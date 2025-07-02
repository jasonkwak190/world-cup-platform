-- ================================================
-- 🧹 구버전 테이블 정리 스크립트
-- ================================================
-- user_interactions와 comments 테이블로 마이그레이션 완료 후 실행

-- 데이터 마이그레이션 확인
DO $$
DECLARE
    comment_likes_count INTEGER;
    user_interactions_comment_likes INTEGER;
    user_likes_count INTEGER;
    user_interactions_worldcup_likes INTEGER;
    user_bookmarks_count INTEGER;
    user_interactions_bookmarks INTEGER;
    worldcup_comments_count INTEGER;
    comments_count INTEGER;
BEGIN
    -- 마이그레이션 상태 확인
    SELECT COUNT(*) INTO comment_likes_count FROM comment_likes;
    SELECT COUNT(*) INTO user_interactions_comment_likes 
    FROM user_interactions 
    WHERE target_type = 'comment' AND interaction_type = 'like';
    
    SELECT COUNT(*) INTO user_likes_count FROM user_likes;
    SELECT COUNT(*) INTO user_interactions_worldcup_likes 
    FROM user_interactions 
    WHERE target_type = 'worldcup' AND interaction_type = 'like';
    
    SELECT COUNT(*) INTO user_bookmarks_count FROM user_bookmarks;
    SELECT COUNT(*) INTO user_interactions_bookmarks 
    FROM user_interactions 
    WHERE target_type = 'worldcup' AND interaction_type = 'bookmark';
    
    SELECT COUNT(*) INTO worldcup_comments_count FROM worldcup_comments;
    SELECT COUNT(*) INTO comments_count FROM comments;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '📊 마이그레이션 상태 확인';
    RAISE NOTICE '================================================';
    RAISE NOTICE '댓글 좋아요: % → % (user_interactions)', comment_likes_count, user_interactions_comment_likes;
    RAISE NOTICE '월드컵 좋아요: % → % (user_interactions)', user_likes_count, user_interactions_worldcup_likes;
    RAISE NOTICE '북마크: % → % (user_interactions)', user_bookmarks_count, user_interactions_bookmarks;
    RAISE NOTICE '댓글: % → % (comments)', worldcup_comments_count, comments_count;
    RAISE NOTICE '================================================';
    
    -- 마이그레이션 완료도 확인
    IF user_interactions_comment_likes >= comment_likes_count AND
       user_interactions_worldcup_likes >= user_likes_count AND
       user_interactions_bookmarks >= user_bookmarks_count AND
       comments_count >= worldcup_comments_count THEN
        RAISE NOTICE '✅ 마이그레이션이 완료되었습니다.';
        RAISE NOTICE '아래 단계로 구버전 테이블을 안전하게 제거할 수 있습니다.';
    ELSE
        RAISE NOTICE '⚠️ 마이그레이션이 완전하지 않습니다.';
        RAISE NOTICE '데이터 손실 방지를 위해 테이블 제거를 중단합니다.';
        RETURN;
    END IF;
END $$;

-- ================================================
-- 백업 테이블 생성 (안전장치)
-- ================================================

-- 백업 테이블들 생성
CREATE TABLE IF NOT EXISTS backup_old_comment_likes AS SELECT * FROM comment_likes;
CREATE TABLE IF NOT EXISTS backup_old_user_likes AS SELECT * FROM user_likes;
CREATE TABLE IF NOT EXISTS backup_old_user_bookmarks AS SELECT * FROM user_bookmarks;
CREATE TABLE IF NOT EXISTS backup_old_worldcup_comments AS SELECT * FROM worldcup_comments;

-- ================================================
-- 구버전 테이블 제거 (주석 해제하여 실행)
-- ================================================
-- 주의: 이 부분은 마이그레이션이 완전히 확인된 후에만 주석을 해제하여 실행하세요!

/*
-- 1단계: 인덱스와 제약조건 확인
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname IN ('comment_likes', 'user_likes', 'user_bookmarks', 'worldcup_comments');

-- 2단계: 외래키 참조 확인
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('comment_likes', 'user_likes', 'user_bookmarks', 'worldcup_comments');

-- 3단계: 테이블 제거 (CASCADE 사용시 주의)
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS user_likes CASCADE;
DROP TABLE IF EXISTS user_bookmarks CASCADE;
DROP TABLE IF EXISTS worldcup_comments CASCADE;

RAISE NOTICE '🗑️ 구버전 테이블 제거 완료';
RAISE NOTICE '📦 백업 테이블들은 backup_old_* 형태로 보관됩니다';
*/

-- ================================================
-- 최종 확인
-- ================================================

SELECT 
    table_name,
    CASE 
        WHEN table_name LIKE 'backup_old_%' THEN '백업'
        WHEN table_name IN ('user_interactions', 'comments') THEN '새버전'
        WHEN table_name IN ('comment_likes', 'user_likes', 'user_bookmarks', 'worldcup_comments') THEN '구버전'
        ELSE '기타'
    END as table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name IN ('comment_likes', 'user_likes', 'user_bookmarks', 'worldcup_comments', 'user_interactions', 'comments')
    OR table_name LIKE 'backup_old_%'
)
ORDER BY table_type, table_name;