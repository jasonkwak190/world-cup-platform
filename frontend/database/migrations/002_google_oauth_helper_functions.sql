-- Migration: Google OAuth Helper Functions
-- Created: 2025-07-14
-- Purpose: Create helper functions for Google OAuth user management and migration

-- Function to find or create user from Google OAuth data
CREATE OR REPLACE FUNCTION find_or_create_google_user(
    auth_user_id UUID,
    google_email TEXT,
    google_name TEXT,
    google_avatar_url TEXT DEFAULT NULL,
    google_provider_id TEXT DEFAULT NULL
)
RETURNS TABLE(
    user_record users,
    is_new_user BOOLEAN,
    migration_status TEXT
) AS $$
DECLARE
    existing_user users%ROWTYPE;
    new_user users%ROWTYPE;
    is_new BOOLEAN := false;
    migration_msg TEXT := 'success';
BEGIN
    -- 1. First check if user already exists with this supabase_auth_id
    SELECT * INTO existing_user 
    FROM users 
    WHERE supabase_auth_id = auth_user_id;
    
    IF FOUND THEN
        -- User already migrated, return existing record
        RETURN QUERY SELECT existing_user, false, 'already_migrated';
        RETURN;
    END IF;
    
    -- 2. Check if user exists with this email (needs migration)
    SELECT * INTO existing_user 
    FROM users 
    WHERE email = google_email AND supabase_auth_id IS NULL;
    
    IF FOUND THEN
        -- Migrate existing user to Google OAuth
        UPDATE users 
        SET 
            supabase_auth_id = auth_user_id,
            provider = 'google',
            provider_id = google_provider_id,
            avatar_url = COALESCE(google_avatar_url, avatar_url),
            google_email = google_email,
            is_migrated = true,
            updated_at = NOW()
        WHERE id = existing_user.id
        RETURNING * INTO new_user;
        
        -- Log successful migration
        PERFORM log_migration_attempt(
            existing_user.id, 
            existing_user.email, 
            auth_user_id, 
            'migrated_to_google',
            NULL
        );
        
        RETURN QUERY SELECT new_user, false, 'migrated_from_email';
        RETURN;
    END IF;
    
    -- 3. Create new user for first-time Google login
    INSERT INTO users (
        id,
        supabase_auth_id,
        email,
        username,
        display_name,
        provider,
        provider_id,
        avatar_url,
        google_email,
        is_migrated,
        role
    ) VALUES (
        gen_random_uuid(),
        auth_user_id,
        google_email,
        -- Generate username from email or name
        COALESCE(
            NULLIF(split_part(google_name, ' ', 1), ''),
            split_part(google_email, '@', 1),
            'user'
        ),
        google_name,
        'google',
        google_provider_id,
        google_avatar_url,
        google_email,
        true,
        'user'
    ) RETURNING * INTO new_user;
    
    is_new := true;
    migration_msg := 'new_google_user';
    
    RETURN QUERY SELECT new_user, is_new, migration_msg;
END;
$$ LANGUAGE plpgsql;

-- Function to link existing user with Google OAuth
CREATE OR REPLACE FUNCTION link_user_to_google_oauth(
    user_uuid UUID,
    auth_user_id UUID,
    google_email TEXT,
    google_name TEXT DEFAULT NULL,
    google_avatar_url TEXT DEFAULT NULL,
    google_provider_id TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    updated_user users
) AS $$
DECLARE
    target_user users%ROWTYPE;
    result_user users%ROWTYPE;
BEGIN
    -- Get the target user
    SELECT * INTO target_user FROM users WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'User not found', NULL::users;
        RETURN;
    END IF;
    
    -- Check if already linked to different auth account
    IF target_user.supabase_auth_id IS NOT NULL AND target_user.supabase_auth_id != auth_user_id THEN
        RETURN QUERY SELECT false, 'User already linked to different auth account', target_user;
        RETURN;
    END IF;
    
    -- Update user with Google OAuth info
    UPDATE users 
    SET 
        supabase_auth_id = auth_user_id,
        provider = 'google',
        provider_id = google_provider_id,
        avatar_url = COALESCE(google_avatar_url, avatar_url),
        google_email = google_email,
        display_name = COALESCE(google_name, display_name),
        is_migrated = true,
        updated_at = NOW()
    WHERE id = user_uuid
    RETURNING * INTO result_user;
    
    -- Log successful linking
    PERFORM log_migration_attempt(
        user_uuid, 
        target_user.email, 
        auth_user_id, 
        'linked_to_google',
        NULL
    );
    
    RETURN QUERY SELECT true, 'Successfully linked to Google OAuth', result_user;
END;
$$ LANGUAGE plpgsql;

-- Function to get user by supabase auth id
CREATE OR REPLACE FUNCTION get_user_by_auth_id(auth_user_id UUID)
RETURNS users AS $$
DECLARE
    user_record users%ROWTYPE;
BEGIN
    SELECT * INTO user_record 
    FROM users 
    WHERE supabase_auth_id = auth_user_id;
    
    RETURN user_record;
END;
$$ LANGUAGE plpgsql;

-- Function to check migration status
CREATE OR REPLACE FUNCTION check_migration_status()
RETURNS TABLE(
    total_users BIGINT,
    migrated_users BIGINT,
    pending_migration BIGINT,
    email_auth_users BIGINT,
    google_auth_users BIGINT,
    migration_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_migrated = true) as migrated_users,
        COUNT(*) FILTER (WHERE is_migrated = false) as pending_migration,
        COUNT(*) FILTER (WHERE provider = 'email') as email_auth_users,
        COUNT(*) FILTER (WHERE provider = 'google') as google_auth_users,
        ROUND(
            (COUNT(*) FILTER (WHERE is_migrated = true) * 100.0) / 
            NULLIF(COUNT(*), 0), 
            2
        ) as migration_percentage
    FROM users;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned auth data
CREATE OR REPLACE FUNCTION cleanup_orphaned_auth_data()
RETURNS TABLE(
    cleaned_migration_logs INTEGER,
    summary TEXT
) AS $$
DECLARE
    cleaned_logs INTEGER;
BEGIN
    -- Clean migration logs older than 30 days with success status
    DELETE FROM user_migration_log 
    WHERE migration_status IN ('migrated_to_google', 'linked_to_google', 'new_google_user')
    AND created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS cleaned_logs = ROW_COUNT;
    
    RETURN QUERY SELECT 
        cleaned_logs,
        'Cleaned ' || cleaned_logs || ' old migration log entries';
END;
$$ LANGUAGE plpgsql;

-- Function to handle user data preservation during migration
CREATE OR REPLACE FUNCTION preserve_user_relationships(old_user_id UUID, new_user_id UUID)
RETURNS TABLE(
    worldcups_updated INTEGER,
    game_sessions_updated INTEGER,
    status TEXT
) AS $$
DECLARE
    worldcup_count INTEGER;
    session_count INTEGER;
BEGIN
    -- Update worldcups.author_id references
    UPDATE worldcups 
    SET author_id = new_user_id 
    WHERE author_id = old_user_id;
    
    GET DIAGNOSTICS worldcup_count = ROW_COUNT;
    
    -- Update game_sessions.player_id references
    UPDATE game_sessions 
    SET player_id = new_user_id 
    WHERE player_id = old_user_id;
    
    GET DIAGNOSTICS session_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        worldcup_count,
        session_count,
        'Updated ' || worldcup_count || ' worldcups and ' || session_count || ' game sessions';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to application
GRANT EXECUTE ON FUNCTION find_or_create_google_user TO authenticated;
GRANT EXECUTE ON FUNCTION link_user_to_google_oauth TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_by_auth_id TO authenticated;
GRANT EXECUTE ON FUNCTION check_migration_status TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_auth_data TO authenticated;
GRANT EXECUTE ON FUNCTION preserve_user_relationships TO authenticated;

-- Helper functions created successfully!
-- These functions will handle:
-- 1. Finding existing users by email and migrating them to Google OAuth
-- 2. Creating new users from Google OAuth data
-- 3. Linking existing users to Google OAuth accounts
-- 4. Checking migration progress
-- 5. Cleaning up old migration data
-- 6. Preserving user relationships during migration