-- Migration: Add Google OAuth support columns
-- Created: 2025-07-14
-- Purpose: Prepare users table for Google OAuth integration while preserving existing data

-- Add new columns to users table for Google OAuth support
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS supabase_auth_id UUID,
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS provider_id TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS google_email TEXT,
ADD COLUMN IF NOT EXISTS is_migrated BOOLEAN DEFAULT false;

-- Create index on supabase_auth_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_supabase_auth_id ON users(supabase_auth_id);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);
CREATE INDEX IF NOT EXISTS idx_users_is_migrated ON users(is_migrated);

-- Add comments for documentation
COMMENT ON COLUMN users.supabase_auth_id IS 'Bridge column to link with Supabase Auth user ID';
COMMENT ON COLUMN users.provider IS 'Authentication provider: email, google, etc.';
COMMENT ON COLUMN users.provider_id IS 'Provider-specific user ID (e.g., Google user ID)';
COMMENT ON COLUMN users.avatar_url IS 'User avatar URL from OAuth provider';
COMMENT ON COLUMN users.google_email IS 'Original Google email (may differ from primary email)';
COMMENT ON COLUMN users.is_migrated IS 'Flag to track successful OAuth migration';

-- Update existing users to have email provider
UPDATE users 
SET provider = 'email', is_migrated = false 
WHERE provider IS NULL;

-- Create temporary table for migration tracking
CREATE TABLE IF NOT EXISTS user_migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    old_email VARCHAR(255),
    new_supabase_auth_id UUID,
    migration_status VARCHAR(50) DEFAULT 'pending',
    migration_date TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for migration log
CREATE INDEX IF NOT EXISTS idx_migration_log_user_id ON user_migration_log(user_id);
CREATE INDEX IF NOT EXISTS idx_migration_log_status ON user_migration_log(migration_status);

-- Add constraint to ensure supabase_auth_id is unique when not null
ALTER TABLE users 
ADD CONSTRAINT unique_supabase_auth_id 
UNIQUE (supabase_auth_id) DEFERRABLE INITIALLY DEFERRED;

-- Migration validation function
CREATE OR REPLACE FUNCTION validate_user_migration(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has required fields for migration
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_uuid 
        AND email IS NOT NULL 
        AND username IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Log migration attempt function
CREATE OR REPLACE FUNCTION log_migration_attempt(
    user_uuid UUID,
    old_email_val VARCHAR(255),
    new_auth_id UUID,
    status_val VARCHAR(50),
    error_msg TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO user_migration_log (
        user_id, 
        old_email, 
        new_supabase_auth_id, 
        migration_status, 
        error_message
    ) VALUES (
        user_uuid, 
        old_email_val, 
        new_auth_id, 
        status_val, 
        error_msg
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Migration complete! 
-- Next steps:
-- 1. Run helper functions migration (002_google_oauth_helper_functions.sql)
-- 2. Update application code to use new authentication flow
-- 3. Test migration with sample users
-- 4. Run cleanup migration (003_cleanup_email_auth_system.sql) after verification