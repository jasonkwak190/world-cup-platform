-- Supabase SQL Editor에서 실행할 스크립트
-- YouTube 비디오 지원을 위한 필수 컬럼들 추가

-- 1. 현재 worldcup_items 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'worldcup_items' 
AND column_name IN ('video_id', 'media_type', 'video_thumbnail', 'video_duration', 'video_metadata')
ORDER BY ordinal_position;

-- 2. 누락된 컬럼들 추가
ALTER TABLE worldcup_items ADD COLUMN IF NOT EXISTS video_id VARCHAR(20);
ALTER TABLE worldcup_items ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image';
ALTER TABLE worldcup_items ADD COLUMN IF NOT EXISTS video_thumbnail TEXT;
ALTER TABLE worldcup_items ADD COLUMN IF NOT EXISTS video_duration INTEGER;
ALTER TABLE worldcup_items ADD COLUMN IF NOT EXISTS video_metadata JSONB;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_worldcup_items_video_id ON worldcup_items(video_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_media_type ON worldcup_items(media_type);

-- 4. 기존 video_url이 있는 항목들을 video 타입으로 업데이트
UPDATE worldcup_items 
SET media_type = 'video' 
WHERE video_url IS NOT NULL 
  AND video_url != '' 
  AND (media_type IS NULL OR media_type = 'image');

-- 5. 컬럼 추가 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'worldcup_items' 
AND column_name IN ('video_id', 'media_type', 'video_thumbnail', 'video_duration', 'video_metadata')
ORDER BY ordinal_position;