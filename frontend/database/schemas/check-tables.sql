-- ================================================
-- 🔍 테이블 존재 여부 확인 스크립트
-- ================================================

-- 현재 존재하는 테이블들 확인
SELECT table_name, table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 
    'worldcups', 
    'worldcup_items', 
    'user_interactions', 
    'comments', 
    'game_sessions', 
    'game_matches',
    'categories',
    'notifications',
    -- 구버전 테이블들
    'worldcup_comments',
    'comment_likes',
    'user_likes',
    'user_bookmarks'
)
ORDER BY table_name;

-- user_interactions 테이블 스키마 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_interactions'
ORDER BY ordinal_position;

-- comments 테이블 스키마 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'comments'
ORDER BY ordinal_position;

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('user_interactions', 'comments')
ORDER BY tablename, policyname;