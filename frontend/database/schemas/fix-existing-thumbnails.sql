-- ================================================
-- 기존 월드컵 썸네일 URL 수정 스크립트
-- ================================================
-- 
-- 이 스크립트는 기존에 저장된 월드컵의 thumbnail_url을 
-- 올바른 Supabase Storage URL로 업데이트합니다.

-- 1. 현재 썸네일 상태 확인
SELECT 
    id,
    title,
    thumbnail_url,
    created_at
FROM worldcups 
ORDER BY created_at DESC;

-- 2. Storage에 파일이 있지만 thumbnail_url이 잘못된 경우 수정
-- 실제 Storage 경로 예시: abb47b36-d465-4aeb-8884-eca252c7b9a0/thumbnail.webp
-- 올바른 URL: https://rctoxfcyzzsiikopbsne.supabase.co/storage/v1/object/public/worldcup-thumbnails/abb47b36-d465-4aeb-8884-eca252c7b9a0/thumbnail.webp

-- 특정 월드컵의 썸네일 URL 수정 (ID를 실제 값으로 교체)
UPDATE worldcups 
SET thumbnail_url = 'https://rctoxfcyzzsiikopbsne.supabase.co/storage/v1/object/public/worldcup-thumbnails/abb47b36-d465-4aeb-8884-eca252c7b9a0/thumbnail.webp'
WHERE id = 'abb47b36-d465-4aeb-8884-eca252c7b9a0';

-- 3. 업데이트 후 확인
SELECT 
    id,
    title,
    thumbnail_url,
    updated_at
FROM worldcups 
WHERE id = 'abb47b36-d465-4aeb-8884-eca252c7b9a0';

-- 4. 모든 월드컵의 썸네일 URL 일괄 수정 (필요한 경우)
-- UPDATE worldcups 
-- SET thumbnail_url = CASE 
--     WHEN thumbnail_url IS NOT NULL AND thumbnail_url != '' 
--     THEN 'https://rctoxfcyzzsiikopbsne.supabase.co/storage/v1/object/public/worldcup-thumbnails/' || id || '/thumbnail.webp'
--     ELSE thumbnail_url
-- END
-- WHERE thumbnail_url IS NOT NULL;