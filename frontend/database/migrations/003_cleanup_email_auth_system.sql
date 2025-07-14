-- Migration: Cleanup Email Authentication System
-- Created: 2025-07-14
-- Purpose: Remove email/password authentication components after Google OAuth migration
-- WARNING: Run this ONLY after confirming all users have successfully migrated to Google OAuth

-- SAFETY CHECK: Ensure all users are migrated before cleanup
DO $$
DECLARE
    unmigrated_count INTEGER;
    email_auth_count INTEGER;
BEGIN
    -- Count unmigrated users
    SELECT COUNT(*) INTO unmigrated_count 
    FROM users 
    WHERE is_migrated = false OR supabase_auth_id IS NULL;
    
    -- Count email authentication users
    SELECT COUNT(*) INTO email_auth_count 
    FROM users 
    WHERE provider = 'email';
    
    -- Abort if there are unmigrated users
    IF unmigrated_count > 0 THEN
        RAISE EXCEPTION 'Cannot cleanup: % users have not been migrated to Google OAuth. Run migration first.', unmigrated_count;
    END IF;
    
    -- Abort if there are still email auth users
    IF email_auth_count > 0 THEN
        RAISE EXCEPTION 'Cannot cleanup: % users still use email authentication. Complete migration first.', email_auth_count;
    END IF;
    
    RAISE NOTICE 'Safety check passed: All users have been migrated to Google OAuth';
END
$$;

-- Step 1: Archive email authentication tables before dropping
CREATE TABLE IF NOT EXISTS archived_password_reset_otps AS 
SELECT *, NOW() as archived_at 
FROM password_reset_otps;

-- Add archive timestamp to archived table
ALTER TABLE archived_password_reset_otps 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Drop OTP-related tables (email auth specific)
DROP TABLE IF EXISTS password_reset_otps CASCADE;

-- Step 3: Remove email authentication related API routes
-- Note: This needs to be done manually in the codebase:
-- - Remove /api/auth/send-reset-otp/route.ts
-- - Remove /api/auth/reset-password/route.ts
-- - Update supabaseAuth.ts to remove OTP functions
-- - Update AuthModal.tsx to remove password reset UI

-- Step 4: Remove email authentication helper functions from supabaseAuth.ts
-- Note: These functions should be removed from the codebase:
-- - sendPasswordResetOTP()
-- - resetPasswordWithOTP()
-- - signUpWithSupabase() (if not supporting email signup)
-- - signInWithSupabase() email/password flow

-- Step 5: Clean up users table columns that are no longer needed
-- Note: Be careful with this - only remove if you're sure they're not needed

-- Remove OTP-related columns if they exist
-- ALTER TABLE users DROP COLUMN IF EXISTS password_reset_token;
-- ALTER TABLE users DROP COLUMN IF EXISTS password_reset_expires;

-- Step 6: Update user table constraints
-- Make supabase_auth_id required (not null) since all users should have it now
ALTER TABLE users 
ALTER COLUMN supabase_auth_id SET NOT NULL;

-- Make provider default to 'google' for new users
ALTER TABLE users 
ALTER COLUMN provider SET DEFAULT 'google';

-- Step 7: Create view for migration statistics
CREATE OR REPLACE VIEW migration_summary AS
SELECT 
    'Total Users' as metric,
    COUNT(*)::TEXT as value
FROM users
UNION ALL
SELECT 
    'Google OAuth Users' as metric,
    COUNT(*)::TEXT as value
FROM users WHERE provider = 'google'
UNION ALL
SELECT 
    'Migration Completion' as metric,
    ROUND(AVG(CASE WHEN is_migrated THEN 100.0 ELSE 0.0 END), 2)::TEXT || '%' as value
FROM users
UNION ALL
SELECT 
    'Cleanup Date' as metric,
    NOW()::DATE::TEXT as value;

-- Step 8: Create cleanup verification function
CREATE OR REPLACE FUNCTION verify_cleanup_completion()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: All users have supabase_auth_id
    RETURN QUERY
    SELECT 
        'supabase_auth_id_check'::TEXT,
        CASE 
            WHEN COUNT(*) FILTER (WHERE supabase_auth_id IS NULL) = 0 
            THEN 'PASS'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        'Users without supabase_auth_id: ' || COUNT(*) FILTER (WHERE supabase_auth_id IS NULL)
    FROM users;
    
    -- Check 2: All users are migrated
    RETURN QUERY
    SELECT 
        'migration_check'::TEXT,
        CASE 
            WHEN COUNT(*) FILTER (WHERE is_migrated = false) = 0 
            THEN 'PASS'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        'Unmigrated users: ' || COUNT(*) FILTER (WHERE is_migrated = false)
    FROM users;
    
    -- Check 3: No email auth users remain
    RETURN QUERY
    SELECT 
        'provider_check'::TEXT,
        CASE 
            WHEN COUNT(*) FILTER (WHERE provider = 'email') = 0 
            THEN 'PASS'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        'Email auth users remaining: ' || COUNT(*) FILTER (WHERE provider = 'email')
    FROM users;
    
    -- Check 4: OTP table removed
    RETURN QUERY
    SELECT 
        'otp_table_check'::TEXT,
        CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'password_reset_otps'
            ) 
            THEN 'PASS'::TEXT 
            ELSE 'FAIL'::TEXT 
        END,
        'OTP table exists: ' || EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'password_reset_otps'
        )::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create post-cleanup maintenance function
CREATE OR REPLACE FUNCTION post_cleanup_maintenance()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Update statistics
    ANALYZE users;
    
    -- Clean up old migration logs (keep last 7 days for audit)
    DELETE FROM user_migration_log 
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND migration_status IN ('migrated_to_google', 'linked_to_google');
    
    -- Vacuum the users table
    -- Note: VACUUM cannot be run inside a function, so this is a reminder
    result := 'Cleanup maintenance completed. Remember to run: VACUUM ANALYZE users;';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON migration_summary TO authenticated;
GRANT EXECUTE ON FUNCTION verify_cleanup_completion TO authenticated;
GRANT EXECUTE ON FUNCTION post_cleanup_maintenance TO authenticated;

-- Final verification
SELECT * FROM verify_cleanup_completion();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== EMAIL AUTH CLEANUP COMPLETED ===';
    RAISE NOTICE 'All email authentication components have been removed.';
    RAISE NOTICE 'Users table now only supports Google OAuth authentication.';
    RAISE NOTICE 'Run verify_cleanup_completion() to verify the cleanup.';
    RAISE NOTICE 'Remember to:';
    RAISE NOTICE '1. Remove OTP API routes from the codebase';
    RAISE NOTICE '2. Update AuthModal.tsx to remove password reset UI';
    RAISE NOTICE '3. Clean up supabaseAuth.ts functions';
    RAISE NOTICE '4. Run VACUUM ANALYZE users; for optimization';
END
$$;