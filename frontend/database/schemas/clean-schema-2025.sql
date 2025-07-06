-- ===================================================
-- 정리된 이상형 월드컵 플랫폼 데이터베이스 스키마
-- 생성일: 2025-01-05
-- 설명: 불필요한 테이블들을 제거하고 핵심 기능만 남긴 정리된 스키마
-- ===================================================

-- ===================================================
-- 1. 사용자 관련 테이블
-- ===================================================

-- 사용자 정보
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  profile_image_url text,
  role character varying DEFAULT 'user'::character varying 
    CHECK (role::text = ANY (ARRAY['user'::character varying, 'admin'::character varying, 'moderator'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  display_name character varying,
  bio text,
  cover_image_url text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  worldcups_count integer DEFAULT 0,
  last_login_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- 사용자 상호작용 (좋아요, 북마크, 팔로우, 신고, 차단 통합 관리)
CREATE TABLE public.user_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type character varying NOT NULL 
    CHECK (target_type::text = ANY (ARRAY['worldcup'::character varying, 'comment'::character varying, 'user'::character varying]::text[])),
  target_id uuid NOT NULL,
  interaction_type character varying NOT NULL 
    CHECK (interaction_type::text = ANY (ARRAY['like'::character varying, 'bookmark'::character varying, 'follow'::character varying, 'report'::character varying, 'block'::character varying]::text[])),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT user_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ===================================================
-- 2. 월드컵 관련 테이블
-- ===================================================

-- 월드컵 정보
CREATE TABLE public.worldcups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  category character varying DEFAULT 'entertainment'::character varying,
  thumbnail_url text,
  author_id uuid,
  participants integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  is_public boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category_id integer,
  slug character varying,
  status character varying DEFAULT 'published'::character varying 
    CHECK (status::text = ANY (ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying, 'banned'::character varying]::text[])),
  visibility character varying DEFAULT 'public'::character varying 
    CHECK (visibility::text = ANY (ARRAY['public'::character varying, 'private'::character varying, 'unlisted'::character varying]::text[])),
  allow_anonymous_play boolean DEFAULT true,
  tags text[],
  search_vector tsvector,
  bookmark_count integer DEFAULT 0,
  CONSTRAINT worldcups_pkey PRIMARY KEY (id),
  CONSTRAINT worldcups_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- 월드컵 아이템 정보 (통계 기능 포함)
CREATE TABLE public.worldcup_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worldcup_id uuid NOT NULL,
  title character varying NOT NULL,
  image_url text NOT NULL,
  description text,
  order_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- 통계 정보
  seed integer,
  win_count integer NOT NULL DEFAULT 0,
  loss_count integer NOT NULL DEFAULT 0,
  win_rate numeric(5,2) NOT NULL DEFAULT 0.00 CHECK (win_rate >= 0 AND win_rate <= 100),
  total_appearances integer NOT NULL DEFAULT 0,
  championship_wins integer NOT NULL DEFAULT 0,
  -- 미디어 정보
  video_url text,
  video_start_time integer DEFAULT 0,
  video_end_time integer,
  source_url text,
  attribution text,
  CONSTRAINT worldcup_items_pkey PRIMARY KEY (id),
  CONSTRAINT worldcup_items_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id) ON DELETE CASCADE
);

-- ===================================================
-- 3. 댓글 시스템
-- ===================================================

-- 댓글 정보 (대댓글 지원)
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worldcup_id uuid NOT NULL,
  author_id uuid,
  parent_id uuid,
  content text NOT NULL 
    CHECK (length(TRIM(BOTH FROM content)) >= 1 AND length(content) <= 2000),
  guest_name character varying,
  guest_session_id character varying,
  is_edited boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  like_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE,
  CONSTRAINT comments_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id) ON DELETE CASCADE,
  CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- ===================================================
-- 4. 게임 시스템
-- ===================================================

-- 게임 세션 정보
CREATE TABLE public.game_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worldcup_id uuid NOT NULL,
  player_id uuid,
  session_token character varying UNIQUE,
  tournament_bracket jsonb,
  current_round integer DEFAULT 1,
  status character varying DEFAULT 'in_progress'::character varying 
    CHECK (status::text = ANY (ARRAY['in_progress'::character varying, 'completed'::character varying, 'abandoned'::character varying]::text[])),
  winner_item_id uuid,
  runner_up_item_id uuid,
  total_rounds integer,
  total_matches integer,
  play_time_seconds integer,
  player_ip inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT game_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT game_sessions_runner_up_item_id_fkey FOREIGN KEY (runner_up_item_id) REFERENCES public.worldcup_items(id) ON DELETE SET NULL,
  CONSTRAINT game_sessions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT game_sessions_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id) ON DELETE CASCADE,
  CONSTRAINT game_sessions_winner_item_id_fkey FOREIGN KEY (winner_item_id) REFERENCES public.worldcup_items(id) ON DELETE SET NULL
);

-- 게임 매치 정보 (상세 매치 기록)
CREATE TABLE public.game_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  worldcup_id uuid NOT NULL,
  round_number integer NOT NULL,
  match_number integer NOT NULL,
  item1_id uuid NOT NULL,
  item2_id uuid NOT NULL,
  winner_id uuid NOT NULL,
  decision_time_ms integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT game_matches_pkey PRIMARY KEY (id),
  CONSTRAINT game_matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.worldcup_items(id) ON DELETE CASCADE,
  CONSTRAINT game_matches_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  CONSTRAINT game_matches_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id) ON DELETE CASCADE,
  CONSTRAINT game_matches_item1_id_fkey FOREIGN KEY (item1_id) REFERENCES public.worldcup_items(id) ON DELETE CASCADE,
  CONSTRAINT game_matches_item2_id_fkey FOREIGN KEY (item2_id) REFERENCES public.worldcup_items(id) ON DELETE CASCADE
);

-- 게임 결과 정보 (요약 정보)
CREATE TABLE public.game_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worldcup_id uuid NOT NULL,
  user_id uuid,
  winner_item_id uuid NOT NULL,
  runner_up_item_id uuid,
  rounds_played integer NOT NULL,
  play_time_seconds integer,
  user_ip inet,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT game_results_pkey PRIMARY KEY (id),
  CONSTRAINT game_results_winner_item_id_fkey FOREIGN KEY (winner_item_id) REFERENCES public.worldcup_items(id) ON DELETE CASCADE,
  CONSTRAINT game_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT game_results_worldcup_id_fkey FOREIGN KEY (worldcup_id) REFERENCES public.worldcups(id) ON DELETE CASCADE,
  CONSTRAINT game_results_runner_up_item_id_fkey FOREIGN KEY (runner_up_item_id) REFERENCES public.worldcup_items(id) ON DELETE SET NULL
);

-- ===================================================
-- 5. 인덱스 생성 (성능 최적화)
-- ===================================================

-- 사용자 상호작용 인덱스
CREATE INDEX idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_target ON public.user_interactions(target_type, target_id);
CREATE INDEX idx_user_interactions_type ON public.user_interactions(interaction_type);
CREATE UNIQUE INDEX idx_user_interactions_unique ON public.user_interactions(user_id, target_type, target_id, interaction_type);

-- 월드컵 관련 인덱스
CREATE INDEX idx_worldcups_author_id ON public.worldcups(author_id);
CREATE INDEX idx_worldcups_category ON public.worldcups(category);
CREATE INDEX idx_worldcups_created_at ON public.worldcups(created_at DESC);
CREATE INDEX idx_worldcups_is_public ON public.worldcups(is_public);

-- 월드컵 아이템 인덱스
CREATE INDEX idx_worldcup_items_worldcup_id ON public.worldcup_items(worldcup_id);
CREATE INDEX idx_worldcup_items_win_rate ON public.worldcup_items(win_rate DESC);
CREATE INDEX idx_worldcup_items_championship_wins ON public.worldcup_items(championship_wins DESC);
CREATE INDEX idx_worldcup_items_total_appearances ON public.worldcup_items(total_appearances DESC);

-- 댓글 관련 인덱스
CREATE INDEX idx_comments_worldcup_id ON public.comments(worldcup_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- 게임 관련 인덱스
CREATE INDEX idx_game_sessions_worldcup_id ON public.game_sessions(worldcup_id);
CREATE INDEX idx_game_sessions_player_id ON public.game_sessions(player_id);
CREATE INDEX idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX idx_game_matches_session_id ON public.game_matches(session_id);
CREATE INDEX idx_game_matches_worldcup_id ON public.game_matches(worldcup_id);
CREATE INDEX idx_game_results_worldcup_id ON public.game_results(worldcup_id);

-- ===================================================
-- 6. 트리거 함수 (자동 업데이트)
-- ===================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worldcups_updated_at
    BEFORE UPDATE ON public.worldcups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worldcup_items_updated_at
    BEFORE UPDATE ON public.worldcup_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- 7. RLS (Row Level Security) 정책 설정
-- ===================================================

-- 사용자는 자신의 데이터만 수정 가능
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 공개 월드컵은 모두가 읽기 가능
ALTER TABLE public.worldcups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worldcup_items ENABLE ROW LEVEL SECURITY;

-- ===================================================
-- 7. RLS 정책 설정
-- ===================================================

-- worldcup_items 테이블 RLS 정책
CREATE POLICY "worldcup_items_select_policy" ON public.worldcup_items
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.is_public = true
        )
    );

CREATE POLICY "worldcup_items_insert_policy" ON public.worldcup_items
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.author_id = auth.uid()
        )
    );

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

CREATE POLICY "worldcup_items_delete_policy" ON public.worldcup_items
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.author_id = auth.uid()
        )
    );

-- worldcups 테이블 RLS 정책
CREATE POLICY "worldcups_select_policy" ON public.worldcups
    FOR SELECT 
    USING (
        is_public = true OR 
        author_id = auth.uid()
    );

CREATE POLICY "worldcups_insert_policy" ON public.worldcups
    FOR INSERT 
    WITH CHECK (auth.uid() = author_id);

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

CREATE POLICY "worldcups_delete_policy" ON public.worldcups
    FOR DELETE 
    USING (author_id = auth.uid());

-- users 테이블 RLS 정책
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT 
    USING (true);

CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- user_interactions 테이블 RLS 정책
CREATE POLICY "user_interactions_all_policy" ON public.user_interactions
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- comments 테이블 RLS 정책
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
        auth.uid() = author_id OR author_id IS NULL
    );

CREATE POLICY "comments_update_policy" ON public.comments
    FOR UPDATE 
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_delete_policy" ON public.comments
    FOR DELETE 
    USING (auth.uid() = author_id);

-- ===================================================
-- 8. 통계 업데이트 함수 (RLS 우회)
-- ===================================================

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
SECURITY DEFINER
AS $$
DECLARE
    result_count INTEGER;
    safe_win_rate NUMERIC(5,2);
BEGIN
    -- win_rate를 안전한 범위로 제한 (0.00 ~ 100.00)
    safe_win_rate := LEAST(GREATEST(COALESCE(new_win_rate, 0), 0), 100);
    
    UPDATE public.worldcup_items 
    SET 
        win_count = COALESCE(new_win_count, 0),
        loss_count = COALESCE(new_loss_count, 0),
        win_rate = safe_win_rate,
        total_appearances = COALESCE(new_total_appearances, 0),
        championship_wins = COALESCE(new_championship_wins, 0),
        updated_at = NOW()
    WHERE id = item_uuid;
    
    GET DIAGNOSTICS result_count = ROW_COUNT;
    
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
-- 스키마 정리 완료
-- 총 8개의 핵심 테이블로 구성된 깔끔한 데이터베이스 스키마입니다.
-- RLS 정책과 통계 업데이트 함수 포함
-- ===================================================