-- Migration: Add worldcup_items table if missing and update related schema
-- Date: 2025-07-08
-- Purpose: Fix YouTube video support issues

-- =============================================
-- 1. CREATE WORLDCUP_ITEMS TABLE (IF NOT EXISTS)
-- =============================================
CREATE TABLE IF NOT EXISTS worldcup_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worldcup_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    image_url TEXT,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    seed INTEGER,
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    video_url TEXT,
    video_start_time INTEGER DEFAULT 0,
    video_end_time INTEGER,
    source_url TEXT,
    attribution TEXT,
    total_appearances INTEGER DEFAULT 0,
    championship_wins INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. ADD INDEXES (IF NOT EXISTS)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_worldcup_items_worldcup_id ON worldcup_items(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_order_index ON worldcup_items(order_index);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_video_url ON worldcup_items(video_url);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_created_at ON worldcup_items(created_at DESC);

-- =============================================
-- 3. ADD FOREIGN KEY CONSTRAINT (IF NOT EXISTS)
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_worldcup_items_worldcup_id'
    ) THEN
        ALTER TABLE worldcup_items ADD CONSTRAINT fk_worldcup_items_worldcup_id 
            FOREIGN KEY (worldcup_id) REFERENCES worldcups(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================
-- 4. ADD UPDATED_AT TRIGGER (IF NOT EXISTS)
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_worldcup_items_updated_at'
    ) THEN
        CREATE TRIGGER update_worldcup_items_updated_at 
            BEFORE UPDATE ON worldcup_items 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================
-- 5. ENABLE RLS (IF NOT ALREADY ENABLED)
-- =============================================
ALTER TABLE worldcup_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. ADD RLS POLICIES (IF NOT EXISTS)
-- =============================================

-- SELECT Policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'worldcup_items' AND policyname = 'worldcup_items_select_policy'
    ) THEN
        CREATE POLICY worldcup_items_select_policy ON worldcup_items
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM worldcups 
                    WHERE worldcups.id = worldcup_items.worldcup_id 
                    AND (worldcups.is_public = true OR worldcups.author_id = auth.uid())
                )
            );
    END IF;
END $$;

-- INSERT Policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'worldcup_items' AND policyname = 'worldcup_items_insert_policy'
    ) THEN
        CREATE POLICY worldcup_items_insert_policy ON worldcup_items
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM worldcups 
                    WHERE worldcups.id = worldcup_items.worldcup_id 
                    AND worldcups.author_id = auth.uid()
                )
            );
    END IF;
END $$;

-- UPDATE Policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'worldcup_items' AND policyname = 'worldcup_items_update_policy'
    ) THEN
        CREATE POLICY worldcup_items_update_policy ON worldcup_items
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM worldcups 
                    WHERE worldcups.id = worldcup_items.worldcup_id 
                    AND worldcups.author_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM worldcups 
                    WHERE worldcups.id = worldcup_items.worldcup_id 
                    AND worldcups.author_id = auth.uid()
                )
            );
    END IF;
END $$;

-- DELETE Policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'worldcup_items' AND policyname = 'worldcup_items_delete_policy'
    ) THEN
        CREATE POLICY worldcup_items_delete_policy ON worldcup_items
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM worldcups 
                    WHERE worldcups.id = worldcup_items.worldcup_id 
                    AND worldcups.author_id = auth.uid()
                )
            );
    END IF;
END $$;

-- =============================================
-- 7. GRANT PERMISSIONS
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON worldcup_items TO authenticated;
GRANT SELECT ON worldcup_items TO anon;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- You can run this to verify the table was created successfully:
-- SELECT table_name, column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'worldcup_items' 
-- ORDER BY ordinal_position;