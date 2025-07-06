-- ===================================================
-- RLS 우회 함수 생성 - 통계 업데이트
-- ===================================================

-- 통계 업데이트 함수 (RLS 우회, 안전한 numeric 처리)
CREATE OR REPLACE FUNCTION update_item_stats(
    item_uuid UUID,
    new_win_count INTEGER,
    new_loss_count INTEGER,
    new_win_rate NUMERIC,
    new_total_appearances INTEGER,
    new_championship_wins INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- 함수 소유자 권한으로 실행 (RLS 우회)
AS $$
DECLARE
    result_count INTEGER;
    safe_win_rate NUMERIC(5,2);
BEGIN
    -- win_rate를 안전한 범위로 제한 (0.00 ~ 100.00)
    safe_win_rate := LEAST(GREATEST(COALESCE(new_win_rate, 0), 0), 100);
    
    -- 직접 업데이트 실행 (RLS 우회)
    UPDATE public.worldcup_items 
    SET 
        win_count = COALESCE(new_win_count, 0),
        loss_count = COALESCE(new_loss_count, 0),
        win_rate = safe_win_rate,
        total_appearances = COALESCE(new_total_appearances, 0),
        championship_wins = COALESCE(new_championship_wins, 0),
        updated_at = NOW()
    WHERE id = item_uuid;
    
    -- 영향받은 행 수 확인
    GET DIAGNOSTICS result_count = ROW_COUNT;
    
    -- 결과 반환
    RETURN json_build_object(
        'success', result_count > 0,
        'rows_affected', result_count,
        'item_uuid', item_uuid,
        'safe_win_rate', safe_win_rate
    );
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION update_item_stats TO service_role;
GRANT EXECUTE ON FUNCTION update_item_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_item_stats TO anon;

-- ===================================================
-- 추가 옵션: worldcup_items RLS 임시 비활성화 (선택사항)
-- ===================================================

-- 만약 위 함수도 작동하지 않으면 RLS 완전 비활성화
-- ALTER TABLE public.worldcup_items DISABLE ROW LEVEL SECURITY;

-- 나중에 다시 활성화하려면:
-- ALTER TABLE public.worldcup_items ENABLE ROW LEVEL SECURITY;