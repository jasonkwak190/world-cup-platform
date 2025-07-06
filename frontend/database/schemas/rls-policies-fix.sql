-- ===================================================
-- RLS 정책 추가 - worldcup_items 테이블
-- ===================================================

-- 1. worldcup_items 테이블 RLS 정책

-- 읽기 정책: 공개된 월드컵의 아이템은 모두 읽기 가능
CREATE POLICY "worldcup_items_select_policy" ON public.worldcup_items
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.is_public = true
        )
    );

-- 삽입 정책: 인증된 사용자가 자신의 월드컵에만 아이템 추가 가능
CREATE POLICY "worldcup_items_insert_policy" ON public.worldcup_items
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.author_id = auth.uid()
        )
    );

-- 업데이트 정책: 통계 업데이트는 모든 공개 월드컵에 대해 허용 (Service Role 사용)
CREATE POLICY "worldcup_items_update_stats_policy" ON public.worldcup_items
    FOR UPDATE 
    USING (
        -- Service Role이거나 공개 월드컵의 통계 업데이트
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
        -- Service Role이거나 공개 월드컵의 통계 업데이트
        auth.role() = 'service_role' OR
        (
            EXISTS (
                SELECT 1 FROM public.worldcups 
                WHERE worldcups.id = worldcup_items.worldcup_id 
                AND worldcups.is_public = true
            )
        )
    );

-- 삭제 정책: 월드컵 작성자만 아이템 삭제 가능
CREATE POLICY "worldcup_items_delete_policy" ON public.worldcup_items
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.author_id = auth.uid()
        )
    );

-- 2. worldcups 테이블 RLS 정책 추가

-- 읽기 정책: 공개 월드컵은 모두 읽기 가능, 비공개는 작성자만
CREATE POLICY "worldcups_select_policy" ON public.worldcups
    FOR SELECT 
    USING (
        is_public = true OR 
        author_id = auth.uid()
    );

-- 삽입 정책: 인증된 사용자만 월드컵 생성 가능
CREATE POLICY "worldcups_insert_policy" ON public.worldcups
    FOR INSERT 
    WITH CHECK (auth.uid() = author_id);

-- 업데이트 정책: 작성자만 수정 가능, 통계는 Service Role도 가능
CREATE POLICY "worldcups_update_policy" ON public.worldcups
    FOR UPDATE 
    USING (
        auth.role() = 'service_role' OR 
        author_id = auth.uid()
    )
    WITH CHECK (
        auth.role() = 'service_role' OR 
        author_id = auth.uid()
    );

-- 삭제 정책: 작성자만 삭제 가능
CREATE POLICY "worldcups_delete_policy" ON public.worldcups
    FOR DELETE 
    USING (author_id = auth.uid());

-- 3. 기타 테이블 RLS 정책

-- users 테이블
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT 
    USING (true); -- 사용자 정보는 모두 읽기 가능

CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- user_interactions 테이블
CREATE POLICY "user_interactions_all_policy" ON public.user_interactions
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- comments 테이블
CREATE POLICY "comments_select_policy" ON public.comments
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.worldcups 
            WHERE worldcups.id = comments.worldcup_id 
            AND worldcups.is_public = true
        )
    );

CREATE POLICY "comments_insert_policy" ON public.comments
    FOR INSERT 
    WITH CHECK (
        auth.uid() = author_id OR author_id IS NULL -- 비회원 댓글 허용
    );

CREATE POLICY "comments_update_policy" ON public.comments
    FOR UPDATE 
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_delete_policy" ON public.comments
    FOR DELETE 
    USING (auth.uid() = author_id);

-- ===================================================
-- RLS 정책 완료
-- ===================================================