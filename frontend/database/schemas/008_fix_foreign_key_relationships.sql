-- Migration: Fix foreign key relationships for worldcup_items
-- Date: 2025-07-08
-- Purpose: Fix JOIN query issues when playing worldcups

-- =============================================
-- 1. CHECK EXISTING FOREIGN KEY CONSTRAINTS
-- =============================================
-- First check what foreign key constraints already exist
-- SELECT 
--     conname AS constraint_name,
--     conrelid::regclass AS table_name,
--     confrelid::regclass AS referenced_table,
--     a.attname AS column_name,
--     af.attname AS referenced_column
-- FROM pg_constraint c
-- JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
-- JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
-- WHERE c.contype = 'f' 
-- AND (conrelid::regclass::text = 'worldcup_items' OR confrelid::regclass::text = 'worldcups');

-- =============================================
-- 2. DROP DUPLICATE FOREIGN KEY CONSTRAINTS (IF ANY)
-- =============================================
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Get all foreign key constraints from worldcup_items to worldcups
    FOR constraint_record IN 
        SELECT conname AS constraint_name
        FROM pg_constraint c
        WHERE c.contype = 'f' 
        AND conrelid = 'worldcup_items'::regclass
        AND confrelid = 'worldcups'::regclass
    LOOP
        -- Drop each constraint
        EXECUTE 'ALTER TABLE worldcup_items DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- =============================================
-- 3. ADD SINGLE CLEAN FOREIGN KEY CONSTRAINT
-- =============================================
ALTER TABLE worldcup_items 
ADD CONSTRAINT fk_worldcup_items_worldcup_id 
FOREIGN KEY (worldcup_id) REFERENCES worldcups(id) ON DELETE CASCADE;

-- =============================================
-- 4. ENSURE PROPER INDEXES EXIST
-- =============================================
-- Make sure we have the right indexes for JOIN performance
CREATE INDEX IF NOT EXISTS idx_worldcup_items_worldcup_id ON worldcup_items(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_worldcups_id ON worldcups(id);

-- =============================================
-- 5. VERIFY RELATIONSHIP IS CLEAN
-- =============================================
-- This query should return exactly 1 row per worldcup_items->worldcups relationship
-- SELECT 
--     conname AS constraint_name,
--     conrelid::regclass AS table_name,
--     confrelid::regclass AS referenced_table
-- FROM pg_constraint c
-- WHERE c.contype = 'f' 
-- AND conrelid = 'worldcup_items'::regclass
-- AND confrelid = 'worldcups'::regclass;

-- =============================================
-- 6. TEST QUERY TO VERIFY JOIN WORKS
-- =============================================
-- This should work without the embedding error:
-- SELECT w.id, w.title, wi.id as item_id, wi.title as item_title
-- FROM worldcups w
-- LEFT JOIN worldcup_items wi ON w.id = wi.worldcup_id
-- WHERE w.id = 'YOUR_WORLDCUP_ID'
-- LIMIT 5;