
-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. 핵심 엔티티 테이블
-- ================================================

-- 사용자 테이블 (중앙 집중식)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 기본 정보
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    
    -- 프로필
    avatar_url TEXT,
    cover_image_url TEXT,
    
    -- 권한 및 상태
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 통계 (캐시용)
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    worldcups_count INTEGER DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- 제약조건
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_username_check CHECK (length(username) >= 3 AND username ~* '^[a-zA-Z0-9_]+$')
);

-- 카테고리 테이블
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    
    -- 기본 정보
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- 표시 설정
    icon_name VARCHAR(50), -- Lucide icon name
    color_hex VARCHAR(7) DEFAULT '#10B981', -- 기본 에메랄드 색상
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 통계
    worldcups_count INTEGER DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 월드컵 테이블 (핵심 엔티티)
CREATE TABLE worldcups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 기본 정보
    title VARCHAR(200) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE, -- SEO friendly URL
    thumbnail_url TEXT,
    
    -- 관계
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    
    -- 설정
    total_items INTEGER NOT NULL CHECK (total_items >= 4 AND total_items <= 256),
    tournament_type VARCHAR(20) DEFAULT 'single_elimination' 
        CHECK (tournament_type IN ('single_elimination', 'round_robin', 'swiss')),
    
    -- 상태 및 권한
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'archived', 'banned')),
    visibility VARCHAR(20) DEFAULT 'public' 
        CHECK (visibility IN ('public', 'private', 'unlisted')),
    
    -- 기능 설정
    allow_comments BOOLEAN DEFAULT TRUE,
    allow_anonymous_play BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- 통계 (캐시용 - 트리거로 관리)
    view_count INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    
    -- SEO 및 검색
    tags TEXT[], -- PostgreSQL 배열
    search_vector TSVECTOR, -- 전문 검색용
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- 제약조건
    CONSTRAINT worldcups_title_check CHECK (length(title) >= 5 AND length(title) <= 200)
);

-- 월드컵 아이템 테이블
CREATE TABLE worldcup_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    
    -- 기본 정보
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- 미디어
    image_url TEXT,
    video_url TEXT, -- YouTube, Vimeo 등
    video_start_time INTEGER DEFAULT 0, -- 초 단위
    video_end_time INTEGER,
    
    -- 메타데이터
    source_url TEXT,
    attribution TEXT,
    
    -- 토너먼트 설정
    position INTEGER NOT NULL, -- 1부터 시작
    seed INTEGER, -- 시드 번호
    
    -- 통계 (캐시용)
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    win_rate DECIMAL(5,4) DEFAULT 0, -- 승률 (0.0000 ~ 1.0000)
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT worldcup_items_title_check CHECK (length(title) >= 1 AND length(title) <= 100),
    CONSTRAINT worldcup_items_position_check CHECK (position > 0),
    CONSTRAINT worldcup_items_unique_position UNIQUE(worldcup_id, position)
);

-- ================================================
-- 2. 댓글 시스템
-- ================================================

-- 댓글 테이블 (계층형 구조)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 회원 댓글
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 대댓글용
    
    -- 내용
    content TEXT NOT NULL,
    
    -- 비회원 지원
    guest_name VARCHAR(50), -- 비회원 닉네임
    guest_session_id VARCHAR(255), -- 세션 식별자
    
    -- 상태
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE, -- 소프트 삭제
    
    -- 통계 (캐시용)
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT comments_content_check CHECK (length(trim(content)) >= 1 AND length(content) <= 2000),
    CONSTRAINT comments_author_check CHECK (
        (author_id IS NOT NULL AND guest_name IS NULL AND guest_session_id IS NULL) OR
        (author_id IS NULL AND guest_name IS NOT NULL AND guest_session_id IS NOT NULL)
    )
);

-- ================================================
-- 3. 상호작용 시스템 (통합 테이블)
-- ================================================

-- 사용자 상호작용 테이블 (좋아요, 북마크, 팔로우 등 통합)
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('worldcup', 'comment', 'user')),
    target_id UUID NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'bookmark', 'follow', 'report', 'block')),
    
    -- 메타데이터
    metadata JSONB, -- 추가 정보 저장용
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 방지
    UNIQUE(user_id, target_type, target_id, interaction_type)
);

-- ================================================
-- 4. 게임 시스템
-- ================================================

-- 게임 세션 테이블
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    player_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 비회원도 가능
    
    -- 게임 정보
    session_token VARCHAR(255) UNIQUE, -- 비회원 세션 식별
    tournament_bracket JSONB, -- 토너먼트 진행 상태
    current_round INTEGER DEFAULT 1,
    
    -- 결과
    status VARCHAR(20) DEFAULT 'in_progress' 
        CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    winner_item_id UUID REFERENCES worldcup_items(id),
    runner_up_item_id UUID REFERENCES worldcup_items(id),
    
    -- 통계
    total_rounds INTEGER,
    total_matches INTEGER,
    play_time_seconds INTEGER,
    
    -- 메타데이터
    player_ip INET,
    user_agent TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 게임 매치 테이블 (각 대결 기록)
CREATE TABLE game_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    
    -- 매치 정보
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL, -- 라운드 내 매치 순서
    
    -- 참가자
    item1_id UUID NOT NULL REFERENCES worldcup_items(id),
    item2_id UUID NOT NULL REFERENCES worldcup_items(id),
    winner_id UUID NOT NULL REFERENCES worldcup_items(id),
    
    -- 통계
    decision_time_ms INTEGER, -- 결정 시간 (밀리초)
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약조건
    CONSTRAINT game_matches_different_items CHECK (item1_id != item2_id),
    CONSTRAINT game_matches_valid_winner CHECK (winner_id IN (item1_id, item2_id))
);

-- ================================================
-- 5. 알림 시스템
-- ================================================

-- 알림 테이블
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 관계
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 알림을 발생시킨 사용자
    
    -- 알림 정보
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'like_worldcup', 'comment_worldcup', 'follow_user', 
        'featured_worldcup', 'worldcup_trending', 'system_announcement'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- 관련 엔티티
    target_type VARCHAR(20) CHECK (target_type IN ('worldcup', 'comment', 'user')),
    target_id UUID,
    
    -- 상태
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- 메타데이터
    metadata JSONB,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- ================================================
-- 6. 인덱스 생성
-- ================================================

-- Users 테이블 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Categories 테이블 인덱스
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active, display_order);

-- Worldcups 테이블 인덱스
CREATE INDEX idx_worldcups_author_id ON worldcups(author_id);
CREATE INDEX idx_worldcups_category_id ON worldcups(category_id);
CREATE INDEX idx_worldcups_status ON worldcups(status);
CREATE INDEX idx_worldcups_visibility ON worldcups(visibility);
CREATE INDEX idx_worldcups_created_at ON worldcups(created_at DESC);
CREATE INDEX idx_worldcups_published_at ON worldcups(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_worldcups_featured ON worldcups(is_featured, created_at DESC) WHERE is_featured = TRUE;
CREATE INDEX idx_worldcups_search ON worldcups USING GIN(search_vector);
CREATE INDEX idx_worldcups_tags ON worldcups USING GIN(tags);

-- Worldcup Items 테이블 인덱스
CREATE INDEX idx_worldcup_items_worldcup_id ON worldcup_items(worldcup_id);
CREATE INDEX idx_worldcup_items_position ON worldcup_items(worldcup_id, position);

-- Comments 테이블 인덱스
CREATE INDEX idx_comments_worldcup_id ON comments(worldcup_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_guest_session ON comments(guest_session_id) WHERE guest_session_id IS NOT NULL;

-- User Interactions 테이블 인덱스
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_target ON user_interactions(target_type, target_id);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_user_type ON user_interactions(user_id, interaction_type);

-- Game Sessions 테이블 인덱스
CREATE INDEX idx_game_sessions_worldcup_id ON game_sessions(worldcup_id);
CREATE INDEX idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at DESC);

-- Game Matches 테이블 인덱스
CREATE INDEX idx_game_matches_session_id ON game_matches(session_id);
CREATE INDEX idx_game_matches_worldcup_id ON game_matches(worldcup_id);
CREATE INDEX idx_game_matches_items ON game_matches(item1_id, item2_id);

-- Notifications 테이블 인덱스
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);

-- ================================================
-- 7. 전문 검색을 위한 트리거
-- ================================================

-- Worldcups 검색 벡터 업데이트 함수
CREATE OR REPLACE FUNCTION update_worldcup_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('korean', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('korean', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('korean', array_to_string(COALESCE(NEW.tags, ARRAY[]::TEXT[]), ' ')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_worldcup_search_vector
    BEFORE INSERT OR UPDATE ON worldcups
    FOR EACH ROW
    EXECUTE FUNCTION update_worldcup_search_vector();

-- ================================================
-- 8. 통계 업데이트 트리거들
-- ================================================

-- 월드컵 좋아요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_worldcup_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.target_type = 'worldcup' AND NEW.interaction_type = 'like' THEN
        UPDATE worldcups SET like_count = like_count + 1 WHERE id = NEW.target_id;
    ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'worldcup' AND OLD.interaction_type = 'like' THEN
        UPDATE worldcups SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.target_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_worldcup_like_count
    AFTER INSERT OR DELETE ON user_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_worldcup_like_count();

-- 댓글 좋아요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.target_type = 'comment' AND NEW.interaction_type = 'like' THEN
        UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.target_id;
    ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'comment' AND OLD.interaction_type = 'like' THEN
        UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.target_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_comment_like_count
    AFTER INSERT OR DELETE ON user_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_like_count();

-- ================================================
-- 9. 기본 데이터 삽입
-- ================================================

-- 기본 카테고리 데이터
INSERT INTO categories (name, slug, description, icon_name, color_hex, display_order) VALUES
('엔터테인먼트', 'entertainment', '연예인, 아이돌, 배우 관련', 'Star', '#10B981', 1),
('음식', 'food', '음식, 요리, 맛집 관련', 'UtensilsCrossed', '#F59E0B', 2),
('스포츠', 'sports', '스포츠, 운동, 선수 관련', 'Trophy', '#3B82F6', 3),
('게임', 'games', '게임, 캐릭터, e스포츠 관련', 'Gamepad2', '#8B5CF6', 4),
('영화/드라마', 'movies', '영화, 드라마, 애니메이션 관련', 'Film', '#EF4444', 5),
('패션/뷰티', 'fashion', '패션, 뷰티, 스타일 관련', 'Palette', '#EC4899', 6),
('여행', 'travel', '여행지, 관광명소 관련', 'MapPin', '#06B6D4', 7),
('기타', 'others', '기타 분야', 'MoreHorizontal', '#6B7280', 99);

-- 업데이트된 타임스탬프 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_worldcups_updated_at BEFORE UPDATE ON worldcups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_worldcup_items_updated_at BEFORE UPDATE ON worldcup_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();