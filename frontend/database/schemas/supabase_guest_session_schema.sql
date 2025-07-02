-- worldcup_comments 테이블에 guest_session_id 컬럼 추가

-- guest_session_id 컬럼 추가 (비회원 댓글 식별용)
ALTER TABLE worldcup_comments 
ADD COLUMN IF NOT EXISTS guest_session_id TEXT;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_worldcup_comments_guest_session 
ON worldcup_comments(guest_session_id);

-- 기존 비회원 댓글들에 대한 임시 세션 ID 생성 (선택사항)
-- UPDATE worldcup_comments 
-- SET guest_session_id = 'legacy_' || id::text 
-- WHERE user_id IS NULL AND guest_session_id IS NULL;