-- YouTube 동영상 지원을 위한 worldcup_items 테이블 확장
-- Migration: 004_add_video_support.sql

BEGIN;

-- 1. 미디어 타입 컬럼 추가 (기본값: 'image')
ALTER TABLE worldcup_items 
ADD COLUMN media_type VARCHAR(20) DEFAULT 'image' 
CHECK (media_type IN ('image', 'video'));

-- 2. YouTube 동영상 관련 컬럼들 추가
ALTER TABLE worldcup_items ADD COLUMN video_url TEXT;
ALTER TABLE worldcup_items ADD COLUMN video_id VARCHAR(11); -- YouTube Video ID (11자리)
ALTER TABLE worldcup_items ADD COLUMN video_start_time INTEGER DEFAULT 0; -- 시작 시간 (초)
ALTER TABLE worldcup_items ADD COLUMN video_end_time INTEGER; -- 종료 시간 (초, NULL이면 전체 재생)
ALTER TABLE worldcup_items ADD COLUMN video_thumbnail TEXT; -- YouTube 썸네일 URL
ALTER TABLE worldcup_items ADD COLUMN video_duration INTEGER; -- 총 동영상 길이 (초)
ALTER TABLE worldcup_items ADD COLUMN video_metadata JSONB; -- 메타데이터 (제목, 채널명, 설명 등)

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_worldcup_items_media_type ON worldcup_items(media_type);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_video_id ON worldcup_items(video_id) WHERE video_id IS NOT NULL;

-- 4. 제약 조건 추가
-- 동영상 타입인 경우 video_id와 video_url이 필수
ALTER TABLE worldcup_items 
ADD CONSTRAINT check_video_fields 
CHECK (
  (media_type = 'image' AND video_id IS NULL AND video_url IS NULL) OR
  (media_type = 'video' AND video_id IS NOT NULL AND video_url IS NOT NULL)
);

-- 5. 시간 구간 유효성 검사
ALTER TABLE worldcup_items 
ADD CONSTRAINT check_video_time_range 
CHECK (
  media_type = 'image' OR
  (video_start_time >= 0 AND 
   (video_end_time IS NULL OR video_end_time > video_start_time) AND
   (video_duration IS NULL OR video_start_time < video_duration))
);

-- 6. YouTube Video ID 형식 검사 (11자리 영숫자, 하이픈, 언더스코어)
ALTER TABLE worldcup_items 
ADD CONSTRAINT check_video_id_format 
CHECK (
  video_id IS NULL OR 
  video_id ~ '^[a-zA-Z0-9_-]{11}$'
);

-- 7. 기존 데이터 업데이트 (이미지 타입으로 설정)
UPDATE worldcup_items 
SET media_type = 'image' 
WHERE media_type IS NULL;

-- 8. 통계를 위한 뷰 업데이트 (선택사항)
CREATE OR REPLACE VIEW worldcup_media_stats AS
SELECT 
  media_type,
  COUNT(*) as item_count,
  COUNT(DISTINCT worldcup_id) as worldcup_count
FROM worldcup_items 
GROUP BY media_type;

-- 9. 코멘트 추가
COMMENT ON COLUMN worldcup_items.media_type IS '미디어 타입: image(이미지) 또는 video(동영상)';
COMMENT ON COLUMN worldcup_items.video_url IS 'YouTube 원본 URL';
COMMENT ON COLUMN worldcup_items.video_id IS 'YouTube 비디오 ID (11자리)';
COMMENT ON COLUMN worldcup_items.video_start_time IS '재생 시작 시간 (초 단위, 기본값: 0)';
COMMENT ON COLUMN worldcup_items.video_end_time IS '재생 종료 시간 (초 단위, NULL이면 끝까지)';
COMMENT ON COLUMN worldcup_items.video_thumbnail IS 'YouTube 썸네일 이미지 URL';
COMMENT ON COLUMN worldcup_items.video_duration IS '동영상 총 길이 (초 단위)';
COMMENT ON COLUMN worldcup_items.video_metadata IS '동영상 메타데이터 (JSON): 제목, 채널명, 설명, 조회수 등';

COMMIT;

-- 마이그레이션 성공 확인을 위한 샘플 쿼리
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable, 
--   column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'worldcup_items' 
-- AND column_name LIKE '%video%' OR column_name = 'media_type'
-- ORDER BY ordinal_position;