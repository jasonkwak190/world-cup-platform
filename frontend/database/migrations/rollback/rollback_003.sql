-- Rollback Script for 003_cleanup_email_auth_system.sql
-- Created: 2025-07-14
-- Purpose: Restore email authentication system

-- WARNING: This rollback assumes you have archived data to restore
-- Make sure archived_password_reset_otps table exists with valid data

BEGIN;

-- Step 1: Restore password_reset_otps table from archive
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Restore data from archive if it exists
INSERT INTO password_reset_otps (id, email, otp_code, expires_at, used, created_at, used_at)
SELECT id, email, otp_code, expires_at, used, created_at, used_at
FROM archived_password_reset_otps
WHERE archived_password_reset_otps.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Step 2: Make supabase_auth_id nullable again
ALTER TABLE users 
ALTER COLUMN supabase_auth_id DROP NOT NULL;

-- Step 3: Restore provider default to 'email'
ALTER TABLE users 
ALTER COLUMN provider SET DEFAULT 'email';

-- Step 4: Remove post-cleanup functions and views
DROP FUNCTION IF EXISTS verify_cleanup_completion();
DROP FUNCTION IF EXISTS post_cleanup_maintenance();
DROP VIEW IF EXISTS migration_summary;

-- Step 5: Restore indexes for OTP table
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON password_reset_otps(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires ON password_reset_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_used ON password_reset_otps(used);

COMMIT;

-- Verification queries
SELECT 'OTP table restored' as status, COUNT(*) as row_count FROM password_reset_otps;

SELECT 'Users table constraints' as status, 
       is_nullable as supabase_auth_id_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'supabase_auth_id';

-- Note: You will also need to restore the following in your application code:
-- 1. /api/auth/send-reset-otp/route.ts
-- 2. /api/auth/reset-password/route.ts  
-- 3. OTP functions in supabaseAuth.ts
-- 4. Password reset UI in AuthModal.tsx