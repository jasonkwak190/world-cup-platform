-- Rollback Script for 001_add_google_oauth_columns.sql
-- Created: 2025-07-14
-- Purpose: Remove Google OAuth columns and related structures

-- WARNING: This will remove all Google OAuth migration data
-- Make sure to backup any important migration logs before running

BEGIN;

-- Step 1: Remove indexes
DROP INDEX IF EXISTS idx_users_supabase_auth_id;
DROP INDEX IF EXISTS idx_users_provider;
DROP INDEX IF EXISTS idx_users_provider_id;
DROP INDEX IF EXISTS idx_users_is_migrated;
DROP INDEX IF EXISTS idx_migration_log_user_id;
DROP INDEX IF EXISTS idx_migration_log_status;

-- Step 2: Remove constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS unique_supabase_auth_id;

-- Step 3: Drop helper functions
DROP FUNCTION IF EXISTS validate_user_migration(UUID);
DROP FUNCTION IF EXISTS log_migration_attempt(UUID, VARCHAR(255), UUID, VARCHAR(50), TEXT);

-- Step 4: Drop migration log table
DROP TABLE IF EXISTS user_migration_log CASCADE;

-- Step 5: Remove columns from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS supabase_auth_id,
DROP COLUMN IF EXISTS provider,
DROP COLUMN IF EXISTS provider_id,
DROP COLUMN IF EXISTS avatar_url,
DROP COLUMN IF EXISTS google_email,
DROP COLUMN IF EXISTS is_migrated;

-- Step 6: Remove comments
COMMENT ON COLUMN users.supabase_auth_id IS NULL;
COMMENT ON COLUMN users.provider IS NULL;
COMMENT ON COLUMN users.provider_id IS NULL;
COMMENT ON COLUMN users.avatar_url IS NULL;
COMMENT ON COLUMN users.google_email IS NULL;
COMMENT ON COLUMN users.is_migrated IS NULL;

COMMIT;

-- Verification: Check that columns are removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('supabase_auth_id', 'provider', 'provider_id', 'avatar_url', 'google_email', 'is_migrated');

-- Should return no rows if rollback was successful