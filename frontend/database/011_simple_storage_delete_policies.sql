-- Migration: Add simple Storage DELETE policies using owner field
-- Date: 2025-07-09
-- Purpose: Allow authenticated users to delete their own uploaded files

-- =============================================
-- Simple Storage DELETE Policies
-- =============================================

-- 1. Worldcup Images - Allow users to delete files they uploaded
CREATE POLICY "Users can delete their own worldcup images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'worldcup-images' AND auth.uid() = owner);

-- 2. Worldcup Thumbnails - Allow users to delete files they uploaded  
CREATE POLICY "Users can delete their own worldcup thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'worldcup-thumbnails' AND auth.uid() = owner);

-- =============================================
-- Optional: Add SELECT policies if not already present
-- =============================================

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view their own worldcup images" 
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'worldcup-images' AND auth.uid() = owner);

CREATE POLICY "Users can view their own worldcup thumbnails"
ON storage.objects FOR SELECT  
TO authenticated
USING (bucket_id = 'worldcup-thumbnails' AND auth.uid() = owner);

-- =============================================
-- Verification
-- =============================================

-- Check current storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;