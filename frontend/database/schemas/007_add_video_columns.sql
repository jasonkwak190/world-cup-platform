-- Migration: Add missing video-related columns to worldcup_items table
-- Date: 2025-07-08
-- Purpose: Fix YouTube video creation error - missing video_duration and other video columns

-- =============================================
-- 1. ADD VIDEO_DURATION COLUMN (IF NOT EXISTS)
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worldcup_items' AND column_name = 'video_duration'
    ) THEN
        ALTER TABLE worldcup_items 
        ADD COLUMN video_duration INTEGER DEFAULT 0;
    END IF;
END $$;

-- =============================================
-- 2. ADD VIDEO_ID COLUMN (IF NOT EXISTS)
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worldcup_items' AND column_name = 'video_id'
    ) THEN
        ALTER TABLE worldcup_items 
        ADD COLUMN video_id VARCHAR(50);
    END IF;
END $$;

-- =============================================
-- 3. ADD VIDEO_THUMBNAIL COLUMN (IF NOT EXISTS)
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worldcup_items' AND column_name = 'video_thumbnail'
    ) THEN
        ALTER TABLE worldcup_items 
        ADD COLUMN video_thumbnail TEXT;
    END IF;
END $$;

-- =============================================
-- 4. ADD VIDEO_METADATA COLUMN (IF NOT EXISTS)
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worldcup_items' AND column_name = 'video_metadata'
    ) THEN
        ALTER TABLE worldcup_items 
        ADD COLUMN video_metadata JSONB;
    END IF;
END $$;

-- =============================================
-- 5. ADD INDEXES FOR NEW COLUMNS
-- =============================================
CREATE INDEX IF NOT EXISTS idx_worldcup_items_video_id ON worldcup_items(video_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_video_duration ON worldcup_items(video_duration);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_video_metadata ON worldcup_items USING GIN(video_metadata);

-- =============================================
-- 6. UPDATE EXISTING VIDEO RECORDS (OPTIONAL)
-- =============================================
-- If there are existing video records without these fields, you can update them manually
-- UPDATE worldcup_items 
-- SET video_duration = 0 
-- WHERE media_type = 'video' AND video_duration IS NULL;

-- =============================================
-- 7. VERIFICATION QUERY
-- =============================================
-- You can run this to verify all columns were added successfully:
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'worldcup_items' 
-- AND column_name IN ('video_duration', 'video_id', 'video_thumbnail', 'video_metadata', 'media_type')
-- ORDER BY column_name;

-- =============================================
-- 8. COMPLETE COLUMN LIST FOR WORLDCUP_ITEMS
-- =============================================
-- After this migration, worldcup_items table should have these columns:
-- - id (UUID, PK)
-- - worldcup_id (UUID, FK)
-- - title (VARCHAR(255))
-- - image_url (TEXT)
-- - description (TEXT)
-- - order_index (INTEGER)
-- - created_at (TIMESTAMPTZ)
-- - seed (INTEGER)
-- - win_count (INTEGER)
-- - loss_count (INTEGER)
-- - win_rate (DECIMAL)
-- - video_url (TEXT)
-- - video_start_time (INTEGER)
-- - video_end_time (INTEGER)
-- - source_url (TEXT)
-- - attribution (TEXT)
-- - total_appearances (INTEGER)
-- - championship_wins (INTEGER)
-- - updated_at (TIMESTAMPTZ)
-- - media_type (VARCHAR(20)) -- Added in 006
-- - video_duration (INTEGER) -- Added in 007
-- - video_id (VARCHAR(50)) -- Added in 007
-- - video_thumbnail (TEXT) -- Added in 007
-- - video_metadata (JSONB) -- Added in 007