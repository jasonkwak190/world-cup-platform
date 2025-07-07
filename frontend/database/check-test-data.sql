-- 테스트 데이터 확인 쿼리

-- 1. 스크린샷에서 본 월드컵 ID 데이터 확인
SELECT 
    'worldcup_items' as table_name,
    title,
    win_count,
    loss_count,
    win_rate,
    total_appearances,
    championship_wins
FROM public.worldcup_items 
WHERE worldcup_id = '6fd96ed3-751b-452d-bb56-d50e56f9b4b2'
ORDER BY win_rate DESC;

-- 2. 다른 테이블들도 같은 월드컵 ID로 확인
SELECT 
    'worldcup_item_stats' as table_name,
    title,
    win_count,
    lose_count,
    win_rate,
    total_matches,
    recent_matches_7days
FROM public.worldcup_item_stats 
WHERE title IN ('dog5', 'cat2', 'dog2')
LIMIT 10;

-- 3. worldcup_rankings 테이블도 확인
SELECT 
    'worldcup_rankings' as table_name,
    title,
    win_count,
    lose_count,
    win_rate,
    total_matches
FROM public.worldcup_rankings 
WHERE title IN ('dog5', 'cat2', 'dog2')
LIMIT 10;

-- 4. 현재 API가 실제로 어떤 테이블에서 데이터를 가져오는지 확인
-- worldcup_items 테이블에서 최신 업데이트 시간 확인
SELECT 
    title,
    win_count,
    loss_count,
    win_rate,
    total_appearances,
    championship_wins,
    updated_at
FROM public.worldcup_items 
WHERE worldcup_id = '6fd96ed3-751b-452d-bb56-d50e56f9b4b2'
AND updated_at > NOW() - INTERVAL '1 hour'  -- 최근 1시간 내 업데이트
ORDER BY updated_at DESC;