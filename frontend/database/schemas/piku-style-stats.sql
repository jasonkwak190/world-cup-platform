-- PIKU 스타일 통계 시스템을 위한 스키마 변경
-- 기존 승패 기반 통계에서 → 사용자 선택 빈도 기반 통계로 변경

-- ===================================================
-- 1. worldcup_items 테이블에 새로운 통계 컬럼 추가
-- ===================================================

-- 기존 승패 기반 컬럼은 유지하되, 새로운 선택 빈도 컬럼 추가
ALTER TABLE public.worldcup_items 
ADD COLUMN IF NOT EXISTS total_selections integer NOT NULL DEFAULT 0,      -- 총 선택된 횟수
ADD COLUMN IF NOT EXISTS total_appearances_in_matches integer NOT NULL DEFAULT 0,  -- 총 매치 등장 횟수
ADD COLUMN IF NOT EXISTS selection_rate numeric(5,2) NOT NULL DEFAULT 0.00 CHECK (selection_rate >= 0 AND selection_rate <= 100), -- 선택률 (%)
ADD COLUMN IF NOT EXISTS popularity_rank integer;  -- 인기 순위

-- ===================================================
-- 2. 선택 빈도 통계를 계산하는 함수 생성
-- ===================================================

-- 특정 월드컵의 선택 빈도 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_selection_statistics(target_worldcup_id uuid)
RETURNS void AS $$
BEGIN
    -- 1. 각 아이템별 총 선택 횟수 계산
    UPDATE public.worldcup_items 
    SET total_selections = COALESCE(selection_counts.count, 0)
    FROM (
        SELECT winner_id, COUNT(*) as count
        FROM public.game_matches 
        WHERE worldcup_id = target_worldcup_id
        GROUP BY winner_id
    ) selection_counts
    WHERE worldcup_items.id = selection_counts.winner_id
    AND worldcup_items.worldcup_id = target_worldcup_id;

    -- 2. 각 아이템별 총 매치 등장 횟수 계산
    UPDATE public.worldcup_items 
    SET total_appearances_in_matches = COALESCE(appearance_counts.count, 0)
    FROM (
        SELECT item_id, COUNT(*) as count
        FROM (
            SELECT item1_id as item_id FROM public.game_matches WHERE worldcup_id = target_worldcup_id
            UNION ALL
            SELECT item2_id as item_id FROM public.game_matches WHERE worldcup_id = target_worldcup_id
        ) all_appearances
        GROUP BY item_id
    ) appearance_counts
    WHERE worldcup_items.id = appearance_counts.item_id
    AND worldcup_items.worldcup_id = target_worldcup_id;

    -- 3. 선택률 계산 (선택된 횟수 / 등장한 횟수 * 100)
    UPDATE public.worldcup_items 
    SET selection_rate = CASE 
        WHEN total_appearances_in_matches > 0 
        THEN ROUND((total_selections::numeric / total_appearances_in_matches::numeric) * 100, 2)
        ELSE 0 
    END
    WHERE worldcup_id = target_worldcup_id;

    -- 4. 인기 순위 계산 (선택률 기준 내림차순)
    UPDATE public.worldcup_items 
    SET popularity_rank = ranked.rank
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY selection_rate DESC, total_selections DESC) as rank
        FROM public.worldcup_items 
        WHERE worldcup_id = target_worldcup_id
    ) ranked
    WHERE worldcup_items.id = ranked.id
    AND worldcup_items.worldcup_id = target_worldcup_id;

    RAISE NOTICE 'Selection statistics updated for worldcup: %', target_worldcup_id;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- 3. 모든 월드컵의 선택 빈도 통계 업데이트 함수
-- ===================================================

CREATE OR REPLACE FUNCTION update_all_selection_statistics()
RETURNS void AS $$
DECLARE
    worldcup_record RECORD;
BEGIN
    FOR worldcup_record IN 
        SELECT DISTINCT id FROM public.worldcups 
        WHERE EXISTS (
            SELECT 1 FROM public.game_matches 
            WHERE worldcup_id = worldcups.id
        )
    LOOP
        PERFORM update_selection_statistics(worldcup_record.id);
    END LOOP;
    
    RAISE NOTICE 'All selection statistics updated';
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- 4. 실시간 통계 업데이트를 위한 트리거 함수
-- ===================================================

CREATE OR REPLACE FUNCTION update_selection_stats_trigger()
RETURNS trigger AS $$
BEGIN
    -- 새로운 매치가 추가될 때마다 해당 월드컵의 통계 업데이트
    PERFORM update_selection_statistics(NEW.worldcup_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (game_matches 테이블에 INSERT/UPDATE/DELETE 시 자동 업데이트)
DROP TRIGGER IF EXISTS trigger_update_selection_stats ON public.game_matches;
CREATE TRIGGER trigger_update_selection_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.game_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_selection_stats_trigger();

-- ===================================================
-- 5. PIKU 스타일 랭킹 조회 뷰 생성
-- ===================================================

CREATE OR REPLACE VIEW public.piku_style_ranking AS
SELECT 
    wi.id,
    wi.worldcup_id,
    wi.title,
    wi.image_url,
    wi.description,
    -- PIKU 스타일 통계
    wi.total_selections,
    wi.total_appearances_in_matches,
    wi.selection_rate,
    wi.popularity_rank,
    -- 전체 월드컵 통계 (분모)
    (SELECT COUNT(*) FROM public.game_matches gm WHERE gm.worldcup_id = wi.worldcup_id) as total_matches_in_worldcup,
    (SELECT COUNT(DISTINCT session_id) FROM public.game_matches gm WHERE gm.worldcup_id = wi.worldcup_id) as total_players,
    -- 추가 정보
    w.title as worldcup_title,
    w.description as worldcup_description,
    wi.created_at,
    wi.updated_at
FROM public.worldcup_items wi
JOIN public.worldcups w ON wi.worldcup_id = w.id
ORDER BY wi.worldcup_id, wi.popularity_rank;

-- ===================================================
-- 6. 초기 데이터 마이그레이션 - 기존 데이터로 통계 계산
-- ===================================================

-- 모든 기존 월드컵의 선택 빈도 통계 계산
SELECT update_all_selection_statistics();

-- ===================================================
-- 7. 통계 조회를 위한 편의 함수들
-- ===================================================

-- 특정 월드컵의 PIKU 스타일 랭킹 조회
CREATE OR REPLACE FUNCTION get_piku_ranking(target_worldcup_id uuid)
RETURNS TABLE (
    item_id uuid,
    title text,
    image_url text,
    selection_rate numeric,
    total_selections integer,
    total_appearances integer,
    popularity_rank integer,
    versus_win_rate numeric -- 1:1 대결에서의 승률 (기존 방식)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wi.id,
        wi.title,
        wi.image_url,
        wi.selection_rate,
        wi.total_selections,
        wi.total_appearances_in_matches,
        wi.popularity_rank,
        wi.win_rate as versus_win_rate
    FROM public.worldcup_items wi
    WHERE wi.worldcup_id = target_worldcup_id
    ORDER BY wi.popularity_rank ASC;
END;
$$ LANGUAGE plpgsql;

-- 월드컵별 통계 요약 정보
CREATE OR REPLACE FUNCTION get_worldcup_stats_summary(target_worldcup_id uuid)
RETURNS TABLE (
    total_players bigint,
    total_matches bigint,
    total_items bigint,
    avg_selection_rate numeric,
    most_popular_item text,
    most_popular_rate numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT session_id) FROM public.game_matches WHERE worldcup_id = target_worldcup_id),
        (SELECT COUNT(*) FROM public.game_matches WHERE worldcup_id = target_worldcup_id),
        (SELECT COUNT(*) FROM public.worldcup_items WHERE worldcup_id = target_worldcup_id),
        (SELECT AVG(selection_rate) FROM public.worldcup_items WHERE worldcup_id = target_worldcup_id),
        (SELECT title FROM public.worldcup_items WHERE worldcup_id = target_worldcup_id ORDER BY popularity_rank ASC LIMIT 1),
        (SELECT selection_rate FROM public.worldcup_items WHERE worldcup_id = target_worldcup_id ORDER BY popularity_rank ASC LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- 8. 인덱스 추가 (성능 최적화)
-- ===================================================

CREATE INDEX IF NOT EXISTS idx_worldcup_items_selection_rate ON public.worldcup_items(worldcup_id, selection_rate DESC);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_popularity_rank ON public.worldcup_items(worldcup_id, popularity_rank);
CREATE INDEX IF NOT EXISTS idx_game_matches_worldcup_winner ON public.game_matches(worldcup_id, winner_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_worldcup_items ON public.game_matches(worldcup_id, item1_id, item2_id);

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '=================================';
    RAISE NOTICE 'PIKU 스타일 통계 시스템 설치 완료!';
    RAISE NOTICE '=================================';
    RAISE NOTICE '• 선택 빈도 기반 통계 활성화';
    RAISE NOTICE '• 실시간 통계 업데이트 트리거 설치';
    RAISE NOTICE '• PIKU 스타일 랭킹 뷰 생성';
    RAISE NOTICE '• 성능 최적화 인덱스 추가';
    RAISE NOTICE '• 기존 데이터 마이그레이션 완료';
    RAISE NOTICE '=================================';
END $$;