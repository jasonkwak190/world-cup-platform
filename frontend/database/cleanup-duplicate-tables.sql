-- 중복 테이블 정리: worldcup_items만 사용하도록 통합

-- 1. 기존 중복 테이블들 제거 (데이터 백업 후)
-- 주의: 실행 전에 중요한 데이터가 있는지 확인하세요!

-- worldcup_item_stats 테이블 제거 (모두 0이므로 안전)
DROP TABLE IF EXISTS public.worldcup_item_stats CASCADE;

-- worldcup_rankings 테이블 제거 (worldcup_items에 통합)
DROP TABLE IF EXISTS public.worldcup_rankings CASCADE;

-- 2. worldcup_items 테이블이 모든 통계를 처리하는지 확인
-- 필요한 컬럼들이 모두 있는지 체크
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'worldcup_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. worldcup_items 테이블에 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_worldcup_items_stats ON public.worldcup_items(worldcup_id, win_rate DESC, championship_wins DESC);

-- 4. 통계 업데이트 함수가 올바른 테이블을 참조하는지 확인
-- update_item_stats 함수는 이미 worldcup_items 테이블을 올바르게 사용 중

-- 5. RLS 정책 재확인 (익명 사용자 통계 업데이트 허용)
DROP POLICY IF EXISTS "worldcup_items_update_stats_policy" ON public.worldcup_items;

CREATE POLICY "worldcup_items_update_stats_policy" ON public.worldcup_items
    FOR UPDATE 
    USING (
        auth.role() = 'service_role' OR
        (
            EXISTS (
                SELECT 1 FROM public.worldcups 
                WHERE worldcups.id = worldcup_items.worldcup_id 
                AND worldcups.is_public = true
            )
        )
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (
            EXISTS (
                SELECT 1 FROM public.worldcups 
                WHERE worldcups.id = worldcup_items.worldcup_id 
                AND worldcups.is_public = true
            )
        )
    );

-- 6. 데이터 정합성 체크: 통계가 제대로 저장되어 있는지 확인
SELECT 
    worldcup_id,
    title,
    win_count,
    loss_count,
    win_rate,
    total_appearances,
    championship_wins
FROM public.worldcup_items 
WHERE worldcup_id = '6fd96ed3-751b-452d-bb56-d50e56f9b4b2'  -- 테스트했던 월드컵 ID
ORDER BY win_rate DESC
LIMIT 10;