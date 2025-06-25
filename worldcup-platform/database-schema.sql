-- WorldCup Platform Database Schema
-- PostgreSQL 15+ compatible

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_username_check CHECK (length(username) >= 3 AND username ~* '^[a-zA-Z0-9_]+$')
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WorldCups table
CREATE TABLE worldcups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id),
    
    -- Tournament settings
    total_items INTEGER NOT NULL CHECK (total_items >= 4),
    tournament_type VARCHAR(20) DEFAULT 'single_elimination' CHECK (tournament_type IN ('single_elimination', 'round_robin')),
    rounds INTEGER GENERATED ALWAYS AS (CEIL(LOG(2, total_items))) STORED,
    
    -- Status and visibility
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'banned')),
    is_public BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    allow_comments BOOLEAN DEFAULT TRUE,
    
    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    
    -- SEO and search
    slug VARCHAR(255) UNIQUE,
    tags TEXT[], -- PostgreSQL array for tags
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT worldcups_title_check CHECK (length(title) >= 5)
);

-- WorldCup Items table
CREATE TABLE worldcup_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Media content
    image_url TEXT,
    video_url TEXT, -- YouTube URL
    video_start_time INTEGER DEFAULT 0, -- seconds
    video_end_time INTEGER, -- seconds
    
    -- Item metadata
    source_url TEXT,
    source_attribution TEXT,
    
    -- Position in tournament
    position INTEGER NOT NULL,
    seed INTEGER, -- Tournament seeding
    
    -- Statistics
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    win_rate DECIMAL(5,4) GENERATED ALWAYS AS (
        CASE 
            WHEN (win_count + loss_count) = 0 THEN 0
            ELSE ROUND(win_count::DECIMAL / (win_count + loss_count), 4)
        END
    ) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT worldcup_items_position_unique UNIQUE (worldcup_id, position),
    CONSTRAINT worldcup_items_media_check CHECK (image_url IS NOT NULL OR video_url IS NOT NULL)
);

-- Game Sessions table (for tracking individual plays)
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymous users
    
    -- Session data
    session_token VARCHAR(255), -- For anonymous users
    current_round INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    winner_id UUID REFERENCES worldcup_items(id),
    
    -- Progress tracking
    total_matches INTEGER,
    completed_matches INTEGER DEFAULT 0,
    
    -- Session metadata
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure user identification
    CONSTRAINT game_sessions_user_check CHECK (user_id IS NOT NULL OR session_token IS NOT NULL)
);

-- Game Matches table (individual match results)
CREATE TABLE game_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    
    -- Match participants
    item1_id UUID NOT NULL REFERENCES worldcup_items(id),
    item2_id UUID NOT NULL REFERENCES worldcup_items(id),
    winner_id UUID NOT NULL REFERENCES worldcup_items(id),
    
    -- Match timing
    decision_time_ms INTEGER, -- How long user took to decide
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT game_matches_different_items CHECK (item1_id != item2_id),
    CONSTRAINT game_matches_valid_winner CHECK (winner_id IN (item1_id, item2_id))
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested comments
    
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Engagement
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT comments_content_check CHECK (length(trim(content)) >= 1 AND length(content) <= 1000)
);

-- User interactions table (likes, bookmarks, etc.)
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('worldcup', 'comment')),
    target_id UUID NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'bookmark', 'follow', 'report')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate interactions
    UNIQUE(user_id, target_type, target_id, interaction_type)
);

-- Reports table (for content moderation)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('worldcup', 'comment', 'user')),
    target_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    
    -- Moderation
    moderator_id UUID REFERENCES users(id),
    moderator_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Analytics table (for tracking events)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    
    -- Event data
    properties JSONB,
    
    -- Context
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_worldcups_creator_id ON worldcups(creator_id);
CREATE INDEX idx_worldcups_category_id ON worldcups(category_id);
CREATE INDEX idx_worldcups_status ON worldcups(status);
CREATE INDEX idx_worldcups_created_at ON worldcups(created_at DESC);
CREATE INDEX idx_worldcups_play_count ON worldcups(play_count DESC);
CREATE INDEX idx_worldcups_featured ON worldcups(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_worldcups_tags ON worldcups USING GIN(tags);

CREATE INDEX idx_worldcup_items_worldcup_id ON worldcup_items(worldcup_id);
CREATE INDEX idx_worldcup_items_position ON worldcup_items(worldcup_id, position);

CREATE INDEX idx_game_sessions_worldcup_id ON game_sessions(worldcup_id);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at DESC);

CREATE INDEX idx_game_matches_session_id ON game_matches(session_id);
CREATE INDEX idx_game_matches_items ON game_matches(item1_id, item2_id);

CREATE INDEX idx_comments_worldcup_id ON comments(worldcup_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_target ON user_interactions(target_type, target_id);

CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_properties ON analytics_events USING GIN(properties);

-- Insert default categories
INSERT INTO categories (name, description, icon, color, display_order) VALUES
('전체', '모든 카테고리', 'grid', '#6B7280', 0),
('연예인', 'K-POP, 배우, 유명인', 'star', '#EF4444', 1),
('음식', '맛있는 음식과 요리', 'utensils', '#F59E0B', 2),
('여행', '여행지와 관광명소', 'map', '#10B981', 3),
('애니메이션', '애니메이션 캐릭터', 'zap', '#8B5CF6', 4),
('게임', '게임 캐릭터와 아이템', 'gamepad', '#3B82F6', 5),
('영화', '영화와 드라마', 'film', '#F97316', 6),
('음악', '음악과 아티스트', 'music', '#EC4899', 7),
('스포츠', '스포츠와 선수', 'trophy', '#14B8A6', 8),
('기타', '기타 카테고리', 'more-horizontal', '#6B7280', 99);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worldcups_updated_at BEFORE UPDATE ON worldcups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worldcup_items_updated_at BEFORE UPDATE ON worldcup_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update counters
CREATE OR REPLACE FUNCTION update_worldcup_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update play count when a new game session is created
        IF TG_TABLE_NAME = 'game_sessions' THEN
            UPDATE worldcups SET play_count = play_count + 1 WHERE id = NEW.worldcup_id;
        END IF;
        
        -- Update comment count when a new comment is added
        IF TG_TABLE_NAME = 'comments' THEN
            UPDATE worldcups SET comment_count = comment_count + 1 WHERE id = NEW.worldcup_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- Update comment count when a comment is deleted
        IF TG_TABLE_NAME = 'comments' THEN
            UPDATE worldcups SET comment_count = comment_count - 1 WHERE id = OLD.worldcup_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Add counter update triggers
CREATE TRIGGER update_worldcup_play_count AFTER INSERT ON game_sessions
    FOR EACH ROW EXECUTE FUNCTION update_worldcup_counters();

CREATE TRIGGER update_worldcup_comment_count AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_worldcup_counters();

-- Create view for trending worldcups
CREATE VIEW trending_worldcups AS
SELECT 
    w.*,
    u.username as creator_username,
    u.display_name as creator_display_name,
    c.name as category_name,
    c.color as category_color,
    -- Calculate trending score based on recent activity
    (
        COALESCE(w.play_count * 0.5, 0) +
        COALESCE(w.like_count * 2, 0) +
        COALESCE(w.comment_count * 3, 0) +
        -- Boost for recent worldcups
        CASE 
            WHEN w.created_at > NOW() - INTERVAL '7 days' THEN 50
            WHEN w.created_at > NOW() - INTERVAL '30 days' THEN 20
            ELSE 0
        END
    ) as trending_score
FROM worldcups w
LEFT JOIN users u ON w.creator_id = u.id
LEFT JOIN categories c ON w.category_id = c.id
WHERE w.status = 'published' AND w.is_public = TRUE;

-- Create view for recent activity
CREATE VIEW recent_activity AS
SELECT 
    'comment' as activity_type,
    c.id as activity_id,
    c.content as activity_content,
    c.user_id,
    u.username,
    u.display_name,
    c.worldcup_id as target_id,
    w.title as target_title,
    c.created_at
FROM comments c
JOIN users u ON c.user_id = u.id
JOIN worldcups w ON c.worldcup_id = w.id
WHERE c.is_deleted = FALSE

UNION ALL

SELECT 
    'worldcup_created' as activity_type,
    w.id as activity_id,
    w.description as activity_content,
    w.creator_id as user_id,
    u.username,
    u.display_name,
    w.id as target_id,
    w.title as target_title,
    w.created_at
FROM worldcups w
JOIN users u ON w.creator_id = u.id
WHERE w.status = 'published'

ORDER BY created_at DESC;