-- 데이터베이스 테이블 정리 - 사용하지 않는 테이블 제거
-- 실행 전 반드시 백업을 권장합니다

-- ===================================================
-- 1. 백업 테이블들 제거 (7개)
-- 이 테이블들은 현재 코드에서 전혀 사용되지 않습니다
-- ===================================================

DROP TABLE IF EXISTS backup_comment_likes CASCADE;
DROP TABLE IF EXISTS backup_user_bookmarks CASCADE;
DROP TABLE IF EXISTS backup_users CASCADE;
DROP TABLE IF EXISTS backup_worldcup_bookmarks CASCADE;
DROP TABLE IF EXISTS backup_worldcup_comments CASCADE;
DROP TABLE IF EXISTS backup_worldcup_likes CASCADE;
DROP TABLE IF EXISTS backup_worldcups CASCADE;

-- ===================================================
-- 2. 중복 기능 테이블들 제거 (6개)
-- 이 테이블들의 기능은 user_interactions와 comments로 통합되었습니다
-- ===================================================

-- 댓글 좋아요 (user_interactions로 대체)
DROP TABLE IF EXISTS comment_likes CASCADE;

-- 사용자 좋아요 (user_interactions로 대체)
DROP TABLE IF EXISTS user_likes CASCADE;

-- 사용자 북마크 (user_interactions로 대체)
DROP TABLE IF EXISTS user_bookmarks CASCADE;

-- 월드컵 좋아요 (user_interactions로 대체)
DROP TABLE IF EXISTS worldcup_likes CASCADE;

-- 월드컵 북마크 (user_interactions로 대체)
DROP TABLE IF EXISTS worldcup_bookmarks CASCADE;

-- 월드컵 댓글 (comments로 대체)
DROP TABLE IF EXISTS worldcup_comments CASCADE;

-- ===================================================
-- 3. 미구현 기능 테이블들 제거 (2개)
-- 이 테이블들은 현재 코드에서 사용되지 않습니다
-- ===================================================

-- 카테고리 (하드코딩된 카테고리 사용)
DROP TABLE IF EXISTS categories CASCADE;

-- 알림 시스템 (미구현)
DROP TABLE IF EXISTS notifications CASCADE;

-- ===================================================
-- 4. 시퀀스 제거 (필요한 경우)
-- ===================================================

DROP SEQUENCE IF EXISTS categories_id_seq CASCADE;

-- ===================================================
-- 정리 완료 메시지
-- ===================================================

-- 총 15개의 테이블이 제거되었습니다:
-- - 백업 테이블: 7개
-- - 중복 기능 테이블: 6개  
-- - 미구현 기능 테이블: 2개
--
-- 남은 핵심 테이블들:
-- - users (사용자)
-- - worldcups (월드컵)
-- - worldcup_items (월드컵 아이템)
-- - comments (댓글)
-- - user_interactions (사용자 상호작용)
-- - game_sessions (게임 세션)
-- - game_matches (게임 매치)
-- - game_results (게임 결과 - 선택적)