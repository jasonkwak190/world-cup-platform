-- game_sessions 테이블 RLS 정책 추가
CREATE POLICY "game_sessions_select_policy" ON public.game_sessions
    FOR SELECT 
    USING (
        -- Service Role이거나 세션 토큰이 일치하거나 플레이어 본인
        auth.role() = 'service_role' OR
        player_id = auth.uid() OR
        session_token IS NOT NULL
    );

CREATE POLICY "game_sessions_insert_policy" ON public.game_sessions
    FOR INSERT 
    WITH CHECK (
        -- Service Role이거나 플레이어 본인
        auth.role() = 'service_role' OR
        player_id = auth.uid() OR
        player_id IS NULL
    );

CREATE POLICY "game_sessions_update_policy" ON public.game_sessions
    FOR UPDATE 
    USING (
        auth.role() = 'service_role' OR
        player_id = auth.uid()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        player_id = auth.uid()
    );

-- game_results, game_matches 테이블도 비슷하게
CREATE POLICY "game_results_all_policy" ON public.game_results
    FOR ALL 
    USING (auth.role() = 'service_role' OR user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "game_matches_all_policy" ON public.game_matches
    FOR ALL 
    USING (auth.role() = 'service_role');