-- Add missing video-related columns to worldcup_items table
-- Migration: 008_add_missing_video_columns.sql
-- Date: 2025-07-09

-- Add video_id column (YouTube video ID)
ALTER TABLE worldcup_items 
ADD COLUMN IF NOT EXISTS video_id VARCHAR(20);

-- Add media_type column ('image' or 'video')
ALTER TABLE worldcup_items 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(10) DEFAULT 'image';

-- Add video_thumbnail column (YouTube thumbnail URL)
ALTER TABLE worldcup_items 
ADD COLUMN IF NOT EXISTS video_thumbnail TEXT;

-- Add video_duration column (video length in seconds)
ALTER TABLE worldcup_items 
ADD COLUMN IF NOT EXISTS video_duration INTEGER;

-- Add video_metadata column (YouTube metadata as JSON)
ALTER TABLE worldcup_items 
ADD COLUMN IF NOT EXISTS video_metadata JSONB;

-- Create index for video_id for better performance
CREATE INDEX IF NOT EXISTS idx_worldcup_items_video_id ON worldcup_items(video_id);

-- Create index for media_type for better filtering
CREATE INDEX IF NOT EXISTS idx_worldcup_items_media_type ON worldcup_items(media_type);

-- Update existing video items to set media_type = 'video' where video_url exists
UPDATE worldcup_items 
SET media_type = 'video' 
WHERE video_url IS NOT NULL 
  AND video_url != '' 
  AND media_type = 'image';

-- Add comment for documentation
COMMENT ON COLUMN worldcup_items.video_id IS 'YouTube video ID extracted from video_url';
COMMENT ON COLUMN worldcup_items.media_type IS 'Type of media: image or video';
COMMENT ON COLUMN worldcup_items.video_thumbnail IS 'YouTube thumbnail URL';
COMMENT ON COLUMN worldcup_items.video_duration IS 'Video duration in seconds';
COMMENT ON COLUMN worldcup_items.video_metadata IS 'YouTube video metadata (JSON)';