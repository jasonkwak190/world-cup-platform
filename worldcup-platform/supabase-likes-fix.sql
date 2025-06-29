-- 좋아요 시스템 수정을 위한 SQL 스크립트
-- 이 파일을 Supabase SQL Editor에서 실행해주세요

-- 1. 기존 불필요한 테이블들 정리 (주의: 데이터 손실 가능)
-- DROP TABLE IF EXISTS worldcup_likes CASCADE;
-- DROP TABLE IF EXISTS worldcup_bookmarks CASCADE;
-- 필요한 테이블만 user_likes, user_bookmarks 유지

-- 2. 좋아요 수 증가 함수 (이미 있으면 교체)
CREATE OR REPLACE FUNCTION increment_worldcup_likes(worldcup_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE worldcups 
  SET likes = COALESCE(likes, 0) + 1,
      updated_at = NOW()
  WHERE id = worldcup_id;
END;
$$;

-- 3. 좋아요 수 감소 함수 (새로 생성)
CREATE OR REPLACE FUNCTION decrement_worldcup_likes(worldcup_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE worldcups 
  SET likes = GREATEST(COALESCE(likes, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = worldcup_id;
END;
$$;

-- 4. 좋아요 수 동기화 함수 (전체 재계산)
CREATE OR REPLACE FUNCTION sync_worldcup_likes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE worldcups 
  SET likes = (
    SELECT COUNT(*)
    FROM user_likes 
    WHERE user_likes.worldcup_id = worldcups.id
  ),
  updated_at = NOW();
END;
$$;

-- 5. 좋아요 수 동기화 실행 (모든 월드컵의 좋아요 수를 실제 데이터와 맞춤)
SELECT sync_worldcup_likes();

-- 6. 트리거 함수 - 좋아요 추가 시 자동으로 증가
CREATE OR REPLACE FUNCTION handle_user_like_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 좋아요 수 증가
  UPDATE worldcups 
  SET likes = COALESCE(likes, 0) + 1,
      updated_at = NOW()
  WHERE id = NEW.worldcup_id;
  
  RETURN NEW;
END;
$$;

-- 7. 트리거 함수 - 좋아요 삭제 시 자동으로 감소
CREATE OR REPLACE FUNCTION handle_user_like_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 좋아요 수 감소
  UPDATE worldcups 
  SET likes = GREATEST(COALESCE(likes, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = OLD.worldcup_id;
  
  RETURN OLD;
END;
$$;

-- 8. 트리거 생성 (기존 트리거 삭제 후 재생성)
DROP TRIGGER IF EXISTS user_like_insert_trigger ON user_likes;
DROP TRIGGER IF EXISTS user_like_delete_trigger ON user_likes;

CREATE TRIGGER user_like_insert_trigger
  AFTER INSERT ON user_likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_like_insert();

CREATE TRIGGER user_like_delete_trigger
  AFTER DELETE ON user_likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_like_delete();

-- 9. 현재 좋아요 상태 확인용 뷰 (개발용)
CREATE OR REPLACE VIEW worldcup_likes_summary AS
SELECT 
  w.id,
  w.title,
  w.likes as current_likes,
  COUNT(ul.id) as actual_likes,
  w.likes - COUNT(ul.id) as difference
FROM worldcups w
LEFT JOIN user_likes ul ON ul.worldcup_id = w.id
GROUP BY w.id, w.title, w.likes
ORDER BY difference DESC;

-- 완료 메시지
SELECT 'Likes system setup completed! Check worldcup_likes_summary view for verification.' as status;