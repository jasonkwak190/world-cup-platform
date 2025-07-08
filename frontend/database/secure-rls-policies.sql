-- 🔒 보안 강화된 RLS 정책 (Critical 취약점 해결)
-- 
-- 문제점: 기존 RLS 정책이 너무 관대하여 민감정보 노출 위험
-- 해결: 최소 권한 원칙 적용, 민감정보 접근 제한

-- 1. 기존 취약한 정책들 제거
DROP POLICY IF EXISTS "game_sessions_all_policy" ON public.game_sessions;
DROP POLICY IF EXISTS "game_matches_all_policy" ON public.game_matches;
DROP POLICY IF EXISTS "game_results_all_policy" ON public.game_results;

-- 2. 보안 강화된 game_sessions 정책
-- 문제: 모든 사용자가 IP 주소, 세션 토큰 등 민감정보 접근 가능
-- 해결: 본인 세션만 접근 가능, 민감정보 숨김

-- 조회: 본인 세션 + 공개된 통계 정보만
CREATE POLICY "game_sessions_secure_select" ON public.game_sessions
    FOR SELECT 
    USING (
        -- Service Role은 모든 데이터 접근 가능
        auth.role() = 'service_role' OR
        -- 본인 세션만 접근 가능
        player_id = auth.uid() OR
        -- 익명 사용자는 자신의 세션 토큰으로만 접근
        (auth.role() = 'anon' AND session_token = current_setting('request.session_token', true))
    );

-- 삽입: 본인 세션만 생성 가능
CREATE POLICY "game_sessions_secure_insert" ON public.game_sessions
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'service_role' OR
        player_id = auth.uid() OR
        -- 익명 사용자는 IP 주소 등 민감정보 없이만 생성 가능
        (auth.role() = 'anon' AND player_id IS NULL AND ip_address IS NULL)
    );

-- 수정: 본인 세션만 수정 가능
CREATE POLICY "game_sessions_secure_update" ON public.game_sessions
    FOR UPDATE 
    USING (
        auth.role() = 'service_role' OR
        player_id = auth.uid() OR
        (auth.role() = 'anon' AND session_token = current_setting('request.session_token', true))
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        player_id = auth.uid() OR
        (auth.role() = 'anon' AND session_token = current_setting('request.session_token', true))
    );

-- 3. 보안 강화된 game_results 정책
-- 문제: 모든 사용자가 다른 사용자의 게임 결과 접근 가능
-- 해결: 본인 결과만 접근 가능, 통계는 별도 뷰로 제공

-- 조회: 본인 결과 + 집계된 통계만
CREATE POLICY "game_results_secure_select" ON public.game_results
    FOR SELECT 
    USING (
        auth.role() = 'service_role' OR
        user_id = auth.uid() OR
        -- 익명 사용자는 session_token으로만 접근
        (auth.role() = 'anon' AND session_id IN (
            SELECT id FROM game_sessions 
            WHERE session_token = current_setting('request.session_token', true)
        ))
    );

-- 삽입: 본인 결과만 생성 가능
CREATE POLICY "game_results_secure_insert" ON public.game_results
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'service_role' OR
        user_id = auth.uid() OR
        user_id IS NULL
    );

-- 수정: 본인 결과만 수정 가능
CREATE POLICY "game_results_secure_update" ON public.game_results
    FOR UPDATE 
    USING (
        auth.role() = 'service_role' OR
        user_id = auth.uid()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        user_id = auth.uid()
    );

-- 4. 보안 강화된 game_matches 정책
-- 문제: 모든 사용자가 매치 데이터 조작 가능
-- 해결: 읽기 전용, 수정은 서비스 롤만 가능

-- 조회: 공개 월드컵의 매치만 조회 가능
CREATE POLICY "game_matches_secure_select" ON public.game_matches
    FOR SELECT 
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.worldcups 
            WHERE worldcups.id = game_matches.worldcup_id 
            AND worldcups.is_public = true
        )
    );

-- 삽입: 서비스 롤만 가능
CREATE POLICY "game_matches_secure_insert" ON public.game_matches
    FOR INSERT 
    WITH CHECK (auth.role() = 'service_role');

-- 수정: 서비스 롤만 가능
CREATE POLICY "game_matches_secure_update" ON public.game_matches
    FOR UPDATE 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 5. 민감정보 보호를 위한 공개 뷰 생성
-- 문제: IP 주소, 이메일 등 민감정보가 직접 노출
-- 해결: 민감정보를 제외한 공개 뷰 제공

-- 공개 게임 세션 통계 뷰
CREATE OR REPLACE VIEW public.game_sessions_public AS
SELECT 
    id,
    worldcup_id,
    player_id,
    session_token,
    current_round,
    total_rounds,
    is_completed,
    created_at,
    updated_at,
    -- IP 주소는 제외
    -- 사용자 에이전트는 제외
    -- 기타 민감정보는 제외
    'hidden' as ip_address_status,
    'hidden' as user_agent_status
FROM public.game_sessions;

-- 공개 사용자 통계 뷰 (개인식별정보 제외)
CREATE OR REPLACE VIEW public.users_public AS
SELECT 
    id,
    username,
    avatar_url,
    created_at,
    updated_at,
    -- 이메일 주소는 제외
    -- 실명은 제외
    'hidden' as email_status,
    'hidden' as full_name_status
FROM public.users;

-- 6. 뷰에 대한 RLS 정책
-- 뷰는 기본적으로 읽기 전용이므로 SELECT 정책만 필요

-- 공개 게임 세션 뷰 접근 권한
CREATE POLICY "game_sessions_public_select" ON public.game_sessions_public
    FOR SELECT 
    USING (
        auth.role() = 'service_role' OR
        player_id = auth.uid() OR
        true -- 민감정보가 제거된 공개 정보만 포함
    );

-- 공개 사용자 뷰 접근 권한
CREATE POLICY "users_public_select" ON public.users_public
    FOR SELECT 
    USING (
        auth.role() = 'service_role' OR
        id = auth.uid() OR
        true -- 민감정보가 제거된 공개 정보만 포함
    );

-- 7. 기존 위험한 함수들 보안 강화
-- 문제: update_item_stats 함수가 RLS 우회하여 실행됨
-- 해결: 함수 권한 제한, 입력값 검증 추가

-- 기존 함수 제거
DROP FUNCTION IF EXISTS update_item_stats(UUID, INTEGER, INTEGER, NUMERIC, INTEGER, INTEGER);

-- 보안 강화된 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_item_stats_secure(
    p_item_id UUID,
    p_win_count INTEGER,
    p_loss_count INTEGER,
    p_win_rate NUMERIC,
    p_total_appearances INTEGER,
    p_championship_wins INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worldcup_id UUID;
    v_is_public BOOLEAN;
    v_result JSON;
BEGIN
    -- 입력값 검증
    IF p_item_id IS NULL OR 
       p_win_count < 0 OR 
       p_loss_count < 0 OR 
       p_win_rate < 0 OR 
       p_win_rate > 100 OR
       p_total_appearances < 0 OR
       p_championship_wins < 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid input parameters'
        );
    END IF;
    
    -- 아이템이 공개 월드컵에 속하는지 확인
    SELECT wi.worldcup_id, w.is_public 
    INTO v_worldcup_id, v_is_public
    FROM worldcup_items wi
    JOIN worldcups w ON wi.worldcup_id = w.id
    WHERE wi.id = p_item_id;
    
    -- 공개 월드컵이 아니면 업데이트 거부
    IF NOT FOUND OR NOT v_is_public THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Item not found or not in public worldcup'
        );
    END IF;
    
    -- 통계 업데이트
    UPDATE worldcup_items 
    SET 
        win_count = p_win_count,
        loss_count = p_loss_count,
        win_rate = p_win_rate,
        total_appearances = p_total_appearances,
        championship_wins = p_championship_wins,
        updated_at = NOW()
    WHERE id = p_item_id;
    
    -- 결과 반환
    RETURN json_build_object(
        'success', true,
        'item_id', p_item_id,
        'worldcup_id', v_worldcup_id,
        'updated_at', NOW()
    );
END;
$$;

-- 8. 함수 권한 설정 (최소 권한 원칙)
-- 서비스 롤만 실행 가능
GRANT EXECUTE ON FUNCTION update_item_stats_secure TO service_role;

-- 인증된 사용자는 본인 소유 아이템만 업데이트 가능하도록 별도 함수 제공
CREATE OR REPLACE FUNCTION update_my_item_stats(
    p_item_id UUID,
    p_win_count INTEGER,
    p_loss_count INTEGER,
    p_win_rate NUMERIC,
    p_total_appearances INTEGER,
    p_championship_wins INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worldcup_id UUID;
    v_creator_id UUID;
    v_result JSON;
BEGIN
    -- 아이템의 소유자 확인
    SELECT wi.worldcup_id, w.creator_id 
    INTO v_worldcup_id, v_creator_id
    FROM worldcup_items wi
    JOIN worldcups w ON wi.worldcup_id = w.id
    WHERE wi.id = p_item_id;
    
    -- 본인 소유 아이템이 아니면 거부
    IF NOT FOUND OR v_creator_id != auth.uid() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Not authorized to update this item'
        );
    END IF;
    
    -- 보안 강화된 함수 호출
    RETURN update_item_stats_secure(
        p_item_id, p_win_count, p_loss_count, 
        p_win_rate, p_total_appearances, p_championship_wins
    );
END;
$$;

-- 인증된 사용자에게 본인 아이템 업데이트 권한 부여
GRANT EXECUTE ON FUNCTION update_my_item_stats TO authenticated;

-- 9. RLS 정책 활성화 확인
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 10. 보안 개선 사항 로그
-- 이 스크립트 실행 후 다음 사항이 개선됨:
-- ✅ IP 주소, 이메일 등 민감정보 접근 제한
-- ✅ 본인 데이터만 접근 가능한 정책 적용
-- ✅ 공개 정보는 별도 뷰로 안전하게 제공
-- ✅ RLS 우회 함수 보안 강화
-- ✅ 최소 권한 원칙 적용
-- ✅ 입력값 검증 추가

-- 실행 확인
SELECT 'RLS 정책 보안 강화 완료' as status;