-- Rollback Script for 002_google_oauth_helper_functions.sql
-- Created: 2025-07-14
-- Purpose: Remove Google OAuth helper functions

-- WARNING: This will remove all Google OAuth helper functions
-- Any application code depending on these functions will break

BEGIN;

-- Remove all Google OAuth helper functions
DROP FUNCTION IF EXISTS find_or_create_google_user(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS link_user_to_google_oauth(UUID, UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_by_auth_id(UUID);
DROP FUNCTION IF EXISTS check_migration_status();
DROP FUNCTION IF EXISTS cleanup_orphaned_auth_data();
DROP FUNCTION IF EXISTS preserve_user_relationships(UUID, UUID);

-- Remove any views that might depend on these functions
DROP VIEW IF EXISTS migration_summary;

COMMIT;

-- Verification: Check that functions are removed
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE specific_schema = 'public'
AND (
    routine_name LIKE '%google%' 
    OR routine_name LIKE '%migration%' 
    OR routine_name LIKE '%oauth%'
);

-- Should return no OAuth/migration related functions if rollback was successful