-- Migration: Add Storage DELETE policies for worldcup files
-- Date: 2025-07-09
-- Purpose: Allow users to delete their own worldcup-related files from Storage

-- =============================================
-- Storage DELETE Policies for Worldcup Images
-- =============================================

-- 1. Worldcup Images - Allow users to delete their own worldcup images
CREATE POLICY "Allow users to delete their own worldcup images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'worldcup-images' AND
  auth.uid() = (
    -- 파일 경로에서 worldcup_id를 추출하여 worldcups 테이블의 author_id와 비교
    -- 경로 형식: {worldcup_id}/items/{filename}
    SELECT author_id FROM public.worldcups
    WHERE id = (string_to_array(name, '/'))[1]::uuid
  )
);

-- 2. Worldcup Thumbnails - Allow users to delete their own worldcup thumbnails
CREATE POLICY "Allow users to delete their own worldcup thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'worldcup-thumbnails' AND
  auth.uid() = (
    -- 파일 경로에서 worldcup_id를 추출하여 worldcups 테이블의 author_id와 비교
    -- 경로 형식: {worldcup_id}/thumbnail.{ext}
    SELECT author_id FROM public.worldcups
    WHERE id = (string_to_array(name, '/'))[1]::uuid
  )
);

-- =============================================
-- Verification Queries (주석 해제 후 테스트 가능)
-- =============================================

-- 현재 Storage 정책 확인
-- SELECT 
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies 
-- WHERE schemaname = 'storage' AND tablename = 'objects'
-- ORDER BY policyname;

-- 특정 사용자의 월드컵 파일 삭제 권한 테스트 (실제 UUID로 교체 필요)
-- SELECT 
--   name,
--   bucket_id,
--   auth.uid() as current_user,
--   (
--     SELECT author_id FROM public.worldcups
--     WHERE id = (string_to_array(name, '/'))[1]::uuid
--   ) as file_owner
-- FROM storage.objects 
-- WHERE bucket_id IN ('worldcup-images', 'worldcup-thumbnails')
-- LIMIT 5;

-- =============================================
-- Test Storage Deletion Function (선택사항)
-- =============================================

-- 스토리지 파일 삭제 테스트를 위한 헬퍼 함수
CREATE OR REPLACE FUNCTION test_storage_deletion(
  test_worldcup_id UUID,
  test_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  file_path TEXT,
  bucket_name TEXT,
  can_delete BOOLEAN,
  owner_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.name as file_path,
    o.bucket_id as bucket_name,
    CASE 
      WHEN o.bucket_id = 'worldcup-images' THEN
        test_user_id = (
          SELECT w.author_id FROM public.worldcups w
          WHERE w.id = (string_to_array(o.name, '/'))[1]::uuid
        )
      WHEN o.bucket_id = 'worldcup-thumbnails' THEN
        test_user_id = (
          SELECT w.author_id FROM public.worldcups w
          WHERE w.id = (string_to_array(o.name, '/'))[1]::uuid
        )
      ELSE false
    END as can_delete,
    (
      SELECT w.author_id FROM public.worldcups w
      WHERE w.id = (string_to_array(o.name, '/'))[1]::uuid
    ) as owner_id
  FROM storage.objects o
  WHERE o.bucket_id IN ('worldcup-images', 'worldcup-thumbnails')
    AND (string_to_array(o.name, '/'))[1]::uuid = test_worldcup_id;
END;
$$;

-- 사용 예시 (실제 UUID로 교체 필요):
-- SELECT * FROM test_storage_deletion('your-worldcup-id-here');

-- =============================================
-- Notes
-- =============================================

-- 1. 이 정책들은 인증된 사용자만 자신이 소유한 월드컵의 파일을 삭제할 수 있도록 제한합니다.
-- 2. 파일 경로 구조는 {worldcup_id}/items/{filename} 또는 {worldcup_id}/thumbnail.{ext} 형식을 가정합니다.
-- 3. 정책 적용 후 deleteWorldCup 함수가 정상적으로 Storage 파일들을 삭제할 수 있게 됩니다.
-- 4. 만약 파일 경로 구조가 다르다면 string_to_array(name, '/') 부분을 수정해야 합니다.