-- CRITICAL SECURITY FIX: Fix Storage DELETE policies
-- Date: 2025-07-09
-- Purpose: Fix serious security vulnerability in Storage policies
-- 
-- ISSUE: Current policies allow ANY authenticated user to delete ANY file
-- FIX: Only allow users to delete files they uploaded (owner check)

-- =============================================
-- 🚨 CRITICAL: Drop existing vulnerable policies
-- =============================================

DROP POLICY IF EXISTS "Users can delete own worldcup item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own worldcup thumbnails" ON storage.objects;

-- =============================================
-- ✅ Create SECURE Storage DELETE policies
-- =============================================

-- 1. SECURE Worldcup Images Policy
CREATE POLICY "Users can delete their own worldcup images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'worldcup-images' AND 
  auth.uid() = owner
);

-- 2. SECURE Worldcup Thumbnails Policy  
CREATE POLICY "Users can delete their own worldcup thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'worldcup-thumbnails' AND 
  auth.uid() = owner
);

-- =============================================
-- Additional security: SELECT policies (if needed)
-- =============================================

-- Allow users to view their own files (if not already present)
CREATE POLICY "Users can view their own worldcup images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'worldcup-images' AND 
  auth.uid() = owner
);

CREATE POLICY "Users can view their own worldcup thumbnails"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'worldcup-thumbnails' AND 
  auth.uid() = owner
);

-- =============================================
-- Verification: Check fixed policies
-- =============================================

-- Verify the new policies are correctly set
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%worldcup%'
ORDER BY policyname;

-- =============================================
-- Security Notes
-- =============================================

-- BEFORE (VULNERABLE):
-- auth.role() = 'authenticated' -> Any logged-in user could delete ANY file
-- 
-- AFTER (SECURE):  
-- auth.uid() = owner -> Only the user who uploaded the file can delete it
--
-- This fixes a critical security vulnerability where any authenticated user
-- could delete other users' worldcup images and thumbnails.