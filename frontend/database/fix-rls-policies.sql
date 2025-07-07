-- RLS 정책 수정: 익명 사용자도 worldcup_items 통계를 업데이트할 수 있도록 허용

-- 기존 업데이트 정책 삭제
DROP POLICY IF EXISTS "worldcup_items_update_stats_policy" ON public.worldcup_items;

-- 새로운 업데이트 정책 생성: 통계 필드만 업데이트 허용 (모든 사용자)
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

-- 게임 관련 테이블들에 대한 RLS 정책 추가 (익명 사용자 허용)
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

-- game_sessions 정책: 모든 사용자가 읽기/쓰기 가능 (공개 월드컵의 경우)
CREATE POLICY "game_sessions_all_policy" ON public.game_sessions
    FOR ALL 
    USING (
        auth.role() = 'service_role' OR
        (
            EXISTS (
                SELECT 1 FROM public.worldcups 
                WHERE worldcups.id = game_sessions.worldcup_id 
                AND worldcups.is_public = true
            )
        )
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (
            EXISTS (
                SELECT 1 FROM public.worldcups 
                WHERE worldcups.id = game_sessions.worldcup_id 
                AND worldcups.is_public = true
            )
        )
    );

-- game_matches 정책: 모든 사용자가 읽기/쓰기 가능 (공개 월드컵의 경우)
CREATE POLICY "game_matches_all_policy" ON public.game_matches
    FOR ALL 
    USING (
        auth.role() = 'service_role' OR
        (
            EXISTS (
                SELECT 1 FROM public.worldcups 
                WHERE worldcups.id = game_matches.worldcup_id 
                AND worldcups.is_public = true
            )
        )
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (
            EXISTS (
                SELECT 1 FROM public.worldcups 
                WHERE worldcups.id = game_matches.worldcup_id 
                AND worldcups.is_public = true
            )
        )
    );

-- game_results 정책: 모든 사용자가 읽기/쓰기 가능 (공개 월드컵의 경우)
CREATE POLICY "game_results_all_policy" ON public.game_results
    FOR ALL 
    USING (
        auth.role() = 'service_role' OR
        (
            EXISTS (
                SELECT 1 FROM public.worldcups 
                WHERE worldcups.id = game_results.worldcup_id 
                AND worldcups.is_public = true
            )
        )
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        (
            EXISTS (
                SELECT 1 FROM public.worldcups 
                WHERE worldcups.id = game_results.worldcup_id 
                AND worldcups.is_public = true
            )
        )
    );

-- RPC 함수 권한도 다시 확인
GRANT EXECUTE ON FUNCTION update_item_stats TO service_role;
GRANT EXECUTE ON FUNCTION update_item_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_item_stats TO anon;

-- 추가: 게임 통계 업데이트를 위한 새로운 RPC 함수
CREATE OR REPLACE FUNCTION update_game_statistics(
    worldcup_uuid UUID,
    matches_data JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_uuid UUID;
    item_data JSON;
    update_result JSON;
    total_updates INTEGER := 0;
    success_updates INTEGER := 0;
BEGIN
    -- matches_data는 아이템별 통계를 포함한 JSON 배열
    FOR item_data IN SELECT * FROM json_array_elements(matches_data)
    LOOP
        item_uuid := (item_data->>'uuid')::UUID;
        
        -- 각 아이템의 통계 업데이트
        UPDATE public.worldcup_items 
        SET 
            win_count = COALESCE((item_data->>'win_count')::INTEGER, 0),
            loss_count = COALESCE((item_data->>'loss_count')::INTEGER, 0),
            win_rate = LEAST(GREATEST(COALESCE((item_data->>'win_rate')::NUMERIC, 0), 0), 100),
            total_appearances = COALESCE((item_data->>'total_appearances')::INTEGER, 0),
            championship_wins = COALESCE((item_data->>'championship_wins')::INTEGER, 0),
            updated_at = NOW()
        WHERE id = item_uuid AND worldcup_id = worldcup_uuid;
        
        total_updates := total_updates + 1;
        
        IF FOUND THEN
            success_updates := success_updates + 1;
        END IF;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'total_updates', total_updates,
        'success_updates', success_updates,
        'worldcup_uuid', worldcup_uuid
    );
END;
$$;

-- 새 함수에 권한 부여
GRANT EXECUTE ON FUNCTION update_game_statistics TO service_role;
GRANT EXECUTE ON FUNCTION update_game_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION update_game_statistics TO anon;