-- Migration: Add media_type column to worldcup_items table
-- Date: 2025-07-08
-- Purpose: Fix YouTube video creation error - missing media_type column

-- =============================================
-- 1. ADD MEDIA_TYPE COLUMN (IF NOT EXISTS)
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'worldcup_items' AND column_name = 'media_type'
    ) THEN
        ALTER TABLE worldcup_items 
        ADD COLUMN media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video'));
    END IF;
END $$;

-- =============================================
-- 2. UPDATE EXISTING RECORDS
-- =============================================
-- Set media_type based on whether video_url exists
UPDATE worldcup_items 
SET media_type = CASE 
    WHEN video_url IS NOT NULL AND video_url != '' THEN 'video'
    ELSE 'image'
END
WHERE media_type IS NULL OR media_type = 'image';

-- =============================================
-- 3. ADD INDEX FOR MEDIA_TYPE (OPTIONAL)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_worldcup_items_media_type ON worldcup_items(media_type);

-- =============================================
-- 4. VERIFICATION QUERY
-- =============================================
-- You can run this to verify the column was added successfully:
-- SELECT column_name, data_type, column_default, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'worldcup_items' AND column_name = 'media_type';

-- =============================================
-- 5. TEST QUERY
-- =============================================
-- Check current data distribution:
-- SELECT media_type, COUNT(*) as count 
-- FROM worldcup_items 
-- GROUP BY media_type;