-- 1. worldcup_items 테이블에 video 관련 컬럼이 있는지 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'worldcup_items' 
AND column_name IN ('video_id', 'media_type', 'video_thumbnail', 'video_duration', 'video_metadata', 'video_url', 'video_start_time', 'video_end_time')
ORDER BY ordinal_position;

-- 2. 실제 데이터 확인 (최근 생성된 월드컵의 아이템들)
SELECT 
    id, title, media_type, video_url, video_id, 
    video_start_time, video_end_time, video_thumbnail,
    created_at
FROM worldcup_items 
WHERE worldcup_id IN (
    SELECT id FROM worldcups 
    ORDER BY created_at DESC 
    LIMIT 3
)
ORDER BY created_at DESC;

-- 3. YouTube URL이 있는데 media_type이 image인 경우 찾기
SELECT 
    id, title, media_type, video_url, video_id,
    CASE 
        WHEN video_url IS NOT NULL AND video_url != '' THEN 'HAS_VIDEO_URL'
        ELSE 'NO_VIDEO_URL'
    END as video_status
FROM worldcup_items 
WHERE video_url IS NOT NULL 
AND video_url != ''
AND (media_type IS NULL OR media_type = 'image')
LIMIT 10;