-- ================================================
-- 🚀 완전한 마이그레이션 가이드 (수정된 버전)
-- ================================================
-- 순서: 1. 이 파일 실행 → 2. 데이터 마이그레이션

-- ================================================
-- STEP 1: 새로운 스키마 생성
-- ================================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 핵심 엔티티 테이블들
-- ================================================

-- 사용자 테이블 업데이트 (기존 유지하면서 컬럼 추가)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS worldcups_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- role 컬럼 업데이트 (기존 CHECK 제약조건 확장)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    END IF;
    
    -- 기존 CHECK 제약조건 제거 후 새로 추가
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('user', 'admin', 'moderator'));
END $$;

-- 카테고리 테이블 생성
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50),
    color_hex VARCHAR(7) DEFAULT '#10B981',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    worldcups_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 통합 상호작용 테이블 생성
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('worldcup', 'comment', 'user')),
    target_id UUID NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'bookmark', 'follow', 'report', 'block')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id, interaction_type)
);

-- 새로운 댓글 테이블 (기존과 병행)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    guest_name VARCHAR(50),
    guest_session_id VARCHAR(255),
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT comments_content_check CHECK (length(trim(content)) >= 1 AND length(content) <= 2000)
    -- 기존 데이터 호환성을 위해 author_check 제약조건 제거
);

-- ================================================
-- 게임 시스템 테이블들
-- ================================================

-- 게임 세션 테이블
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token VARCHAR(255) UNIQUE,
    tournament_bracket JSONB,
    current_round INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'in_progress' 
        CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    winner_item_id UUID REFERENCES worldcup_items(id),
    runner_up_item_id UUID REFERENCES worldcup_items(id),
    total_rounds INTEGER,
    total_matches INTEGER,
    play_time_seconds INTEGER,
    player_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 게임 매치 테이블 (각 대결 상세 기록)
CREATE TABLE IF NOT EXISTS game_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    item1_id UUID NOT NULL REFERENCES worldcup_items(id),
    item2_id UUID NOT NULL REFERENCES worldcup_items(id),
    winner_id UUID NOT NULL REFERENCES worldcup_items(id),
    decision_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT game_matches_different_items CHECK (item1_id != item2_id),
    CONSTRAINT game_matches_valid_winner CHECK (winner_id IN (item1_id, item2_id))
);

-- 알림 시스템
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'like_worldcup', 'comment_worldcup', 'follow_user', 
        'featured_worldcup', 'worldcup_trending', 'system_announcement'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    target_type VARCHAR(20) CHECK (target_type IN ('worldcup', 'comment', 'user')),
    target_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- ================================================
-- 테이블 확장
-- ================================================

-- worldcup_items 테이블에 누락된 컬럼들 추가
ALTER TABLE worldcup_items 
ADD COLUMN IF NOT EXISTS seed INTEGER,
ADD COLUMN IF NOT EXISTS win_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loss_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_start_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_end_time INTEGER,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS attribution TEXT;

-- worldcups 테이블에 새 컬럼들 추가
ALTER TABLE worldcups 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published',
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS allow_anonymous_play BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR,
ADD COLUMN IF NOT EXISTS bookmark_count INTEGER DEFAULT 0;

-- status와 visibility에 CHECK 제약조건 추가
DO $$
BEGIN
    ALTER TABLE worldcups DROP CONSTRAINT IF EXISTS worldcups_status_check;
    ALTER TABLE worldcups ADD CONSTRAINT worldcups_status_check 
        CHECK (status IN ('draft', 'published', 'archived', 'banned'));
        
    ALTER TABLE worldcups DROP CONSTRAINT IF EXISTS worldcups_visibility_check;
    ALTER TABLE worldcups ADD CONSTRAINT worldcups_visibility_check 
        CHECK (visibility IN ('public', 'private', 'unlisted'));
END $$;

-- ================================================
-- 인덱스 생성
-- ================================================

-- Categories 인덱스
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active, display_order);

-- User Interactions 인덱스
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target ON user_interactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_type ON user_interactions(user_id, interaction_type);

-- Comments 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_worldcup_id ON comments(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_guest_session ON comments(guest_session_id) WHERE guest_session_id IS NOT NULL;

-- Game Sessions 인덱스
CREATE INDEX IF NOT EXISTS idx_game_sessions_worldcup_id ON game_sessions(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at DESC);

-- Game Matches 인덱스
CREATE INDEX IF NOT EXISTS idx_game_matches_session_id ON game_matches(session_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_worldcup_id ON game_matches(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_items ON game_matches(item1_id, item2_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_winner ON game_matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_game_matches_created_at ON game_matches(created_at DESC);

-- Notifications 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at DESC);

-- Worldcups 새 컬럼 인덱스
CREATE INDEX IF NOT EXISTS idx_worldcups_category_id ON worldcups(category_id);
CREATE INDEX IF NOT EXISTS idx_worldcups_slug ON worldcups(slug);
CREATE INDEX IF NOT EXISTS idx_worldcups_status ON worldcups(status);
CREATE INDEX IF NOT EXISTS idx_worldcups_visibility ON worldcups(visibility);
CREATE INDEX IF NOT EXISTS idx_worldcups_search ON worldcups USING GIN(search_vector) WHERE search_vector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_worldcups_tags ON worldcups USING GIN(tags) WHERE tags IS NOT NULL;

-- ================================================
-- 기본 데이터 삽입
-- ================================================

INSERT INTO categories (name, slug, description, icon_name, color_hex, display_order) VALUES
('엔터테인먼트', 'entertainment', '연예인, 아이돌, 배우 관련', 'Star', '#10B981', 1),
('음식', 'food', '음식, 요리, 맛집 관련', 'UtensilsCrossed', '#F59E0B', 2),
('스포츠', 'sports', '스포츠, 운동, 선수 관련', 'Trophy', '#3B82F6', 3),
('게임', 'games', '게임, 캐릭터, e스포츠 관련', 'Gamepad2', '#8B5CF6', 4),
('영화/드라마', 'movies', '영화, 드라마, 애니메이션 관련', 'Film', '#EF4444', 5),
('패션/뷰티', 'fashion', '패션, 뷰티, 스타일 관련', 'Palette', '#EC4899', 6),
('여행', 'travel', '여행지, 관광명소 관련', 'MapPin', '#06B6D4', 7),
('기타', 'others', '기타 분야', 'MoreHorizontal', '#6B7280', 99)
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- RLS 정책 설정
-- ================================================

-- 테이블 RLS 활성화
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Categories 정책
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories
    FOR SELECT USING (true);

-- User Interactions 정책
DROP POLICY IF EXISTS "Users can manage own interactions" ON user_interactions;
CREATE POLICY "Users can manage own interactions" ON user_interactions
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view interactions" ON user_interactions;
CREATE POLICY "Anyone can view interactions" ON user_interactions
    FOR SELECT USING (true);

-- Comments 정책
DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON comments;
CREATE POLICY "Anyone can view non-deleted comments" ON comments
    FOR SELECT USING (is_deleted = FALSE);

DROP POLICY IF EXISTS "Anyone can insert comments" ON comments;
CREATE POLICY "Anyone can insert comments" ON comments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authors can update own comments" ON comments;
CREATE POLICY "Authors can update own comments" ON comments
    FOR UPDATE USING (
        (auth.uid() = author_id AND author_id IS NOT NULL) OR
        (auth.uid() IS NULL AND guest_session_id IS NOT NULL)
    );

DROP POLICY IF EXISTS "Authors can delete own comments" ON comments;
CREATE POLICY "Authors can delete own comments" ON comments
    FOR DELETE USING (
        (auth.uid() = author_id AND author_id IS NOT NULL) OR
        (auth.uid() IS NULL AND guest_session_id IS NOT NULL)
    );

-- Game Sessions 정책
DROP POLICY IF EXISTS "Anyone can view game sessions" ON game_sessions;
CREATE POLICY "Anyone can view game sessions" ON game_sessions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert game sessions" ON game_sessions;
CREATE POLICY "Anyone can insert game sessions" ON game_sessions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Players can update own sessions" ON game_sessions;
CREATE POLICY "Players can update own sessions" ON game_sessions
    FOR UPDATE USING (
        auth.uid() = player_id OR 
        (player_id IS NULL AND session_token IS NOT NULL)
    );

-- Game Matches 정책
DROP POLICY IF EXISTS "Anyone can view game matches" ON game_matches;
CREATE POLICY "Anyone can view game matches" ON game_matches
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert game matches" ON game_matches;
CREATE POLICY "Anyone can insert game matches" ON game_matches
    FOR INSERT WITH CHECK (true);

-- Notifications 정책
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id);

-- ================================================
-- 트리거 함수들
-- ================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 통계 업데이트 함수들
CREATE OR REPLACE FUNCTION update_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- 월드컵 좋아요/북마크 수 업데이트
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.target_type = 'worldcup' THEN
        IF NEW.interaction_type = 'like' THEN
            UPDATE worldcups SET likes = (
                SELECT COUNT(*) 
                FROM user_interactions 
                WHERE target_type = 'worldcup' 
                AND target_id = NEW.target_id 
                AND interaction_type = 'like'
            ) WHERE id = NEW.target_id;
        ELSIF NEW.interaction_type = 'bookmark' THEN
            UPDATE worldcups SET bookmark_count = (
                SELECT COUNT(*) 
                FROM user_interactions 
                WHERE target_type = 'worldcup' 
                AND target_id = NEW.target_id 
                AND interaction_type = 'bookmark'
            ) WHERE id = NEW.target_id;
        END IF;
    END IF;
    
    -- 댓글 좋아요 수 업데이트
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.target_type = 'comment' AND NEW.interaction_type = 'like' THEN
        UPDATE comments SET like_count = (
            SELECT COUNT(*) 
            FROM user_interactions 
            WHERE target_type = 'comment' 
            AND target_id = NEW.target_id 
            AND interaction_type = 'like'
        ) WHERE id = NEW.target_id;
    END IF;
    
    -- DELETE의 경우
    IF TG_OP = 'DELETE' THEN
        IF OLD.target_type = 'worldcup' THEN
            IF OLD.interaction_type = 'like' THEN
                UPDATE worldcups SET likes = GREATEST(0, likes - 1) WHERE id = OLD.target_id;
            ELSIF OLD.interaction_type = 'bookmark' THEN
                UPDATE worldcups SET bookmark_count = GREATEST(0, bookmark_count - 1) WHERE id = OLD.target_id;
            END IF;
        ELSIF OLD.target_type = 'comment' AND OLD.interaction_type = 'like' THEN
            UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.target_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 검색 벡터 업데이트 함수 (기본 설정 사용)
CREATE OR REPLACE FUNCTION update_worldcup_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('simple', array_to_string(COALESCE(NEW.tags, ARRAY[]::TEXT[]), ' ')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 트리거 생성
-- ================================================

-- updated_at 트리거들
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON categories;
CREATE TRIGGER trigger_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_worldcups_updated_at ON worldcups;
CREATE TRIGGER trigger_worldcups_updated_at 
    BEFORE UPDATE ON worldcups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_comments_updated_at ON comments;
CREATE TRIGGER trigger_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 통계 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_interaction_counts ON user_interactions;
CREATE TRIGGER trigger_update_interaction_counts
    AFTER INSERT OR UPDATE OR DELETE ON user_interactions
    FOR EACH ROW EXECUTE FUNCTION update_interaction_counts();

-- 검색 벡터 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_worldcup_search_vector ON worldcups;
CREATE TRIGGER trigger_update_worldcup_search_vector
    BEFORE INSERT OR UPDATE ON worldcups
    FOR EACH ROW EXECUTE FUNCTION update_worldcup_search_vector();

-- ================================================
-- 완료 메시지
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ 새로운 데이터베이스 스키마 생성 완료!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '생성된 테이블:';
    RAISE NOTICE '- categories (카테고리 관리)';
    RAISE NOTICE '- user_interactions (통합 상호작용)';
    RAISE NOTICE '- comments (새로운 댓글 시스템)';
    RAISE NOTICE '- game_sessions (게임 세션 관리)';
    RAISE NOTICE '- game_matches (게임 매치 상세)';
    RAISE NOTICE '- notifications (알림 시스템)';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '다음 단계: data-migration-only.sql 실행';
    RAISE NOTICE '그 다음: create-ranking-views.sql 실행';
    RAISE NOTICE '==================================================';
END $$;