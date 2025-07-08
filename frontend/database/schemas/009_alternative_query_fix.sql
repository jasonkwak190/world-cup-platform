-- Alternative fix: Temporarily disable and recreate relationships
-- Date: 2025-07-08
-- Purpose: Alternative approach if 008 doesn't work

-- =============================================
-- 1. CHECK CURRENT FOREIGN KEYS
-- =============================================
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE contype = 'f' 
AND (conrelid::regclass::text = 'worldcup_items' OR confrelid::regclass::text = 'worldcups')
ORDER BY conname;

-- =============================================
-- 2. IF DUPLICATES EXIST, CLEAN THEM UP
-- =============================================
-- Drop ALL foreign key constraints from worldcup_items
ALTER TABLE worldcup_items DROP CONSTRAINT IF EXISTS fk_worldcup_items_worldcup_id;
ALTER TABLE worldcup_items DROP CONSTRAINT IF EXISTS worldcup_items_worldcup_id_fkey;
ALTER TABLE worldcup_items DROP CONSTRAINT IF EXISTS fk_worldcup_items_worldcup_id_1;
ALTER TABLE worldcup_items DROP CONSTRAINT IF EXISTS fk_worldcup_items_worldcup_id_2;

-- =============================================
-- 3. RECREATE CLEAN RELATIONSHIP
-- =============================================
ALTER TABLE worldcup_items 
ADD CONSTRAINT worldcup_items_worldcup_id_fkey 
FOREIGN KEY (worldcup_id) REFERENCES worldcups(id) ON DELETE CASCADE;

-- =============================================
-- 4. VERIFY THE FIX WORKED
-- =============================================
-- Test query that should work now:
-- SELECT w.id, w.title, 
--        (SELECT json_agg(wi) FROM worldcup_items wi WHERE wi.worldcup_id = w.id) as items
-- FROM worldcups w 
-- WHERE w.id = 'YOUR_WORLDCUP_ID';

-- =============================================
-- 5. FINAL VERIFICATION
-- =============================================
SELECT 
    'worldcup_items' as table_name,
    COUNT(*) as foreign_key_count
FROM pg_constraint 
WHERE contype = 'f' 
AND conrelid = 'worldcup_items'::regclass
AND confrelid = 'worldcups'::regclass;