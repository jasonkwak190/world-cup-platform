-- World Cup Platform Database Schema
-- Generated: 2025-07-08
-- Source: MCP Database Query

-- =============================================
-- TABLE: worldcups
-- =============================================
CREATE TABLE IF NOT EXISTS worldcups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    thumbnail_url TEXT,
    author_id UUID NOT NULL,
    participants INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    category_id INTEGER,
    slug VARCHAR(255),
    status VARCHAR(50) DEFAULT 'published',
    visibility VARCHAR(50) DEFAULT 'public',
    allow_anonymous_play BOOLEAN DEFAULT true,
    tags TEXT[],
    search_vector TSVECTOR,
    bookmark_count INTEGER DEFAULT 0
);

-- =============================================
-- TABLE: users
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    profile_image_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    display_name VARCHAR(255),
    bio TEXT,
    cover_image_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    worldcups_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ
);

-- =============================================
-- TABLE: worldcup_items
-- =============================================
CREATE TABLE IF NOT EXISTS worldcup_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worldcup_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    image_url TEXT,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    seed INTEGER,
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    video_url TEXT,
    video_start_time INTEGER DEFAULT 0,
    video_end_time INTEGER,
    source_url TEXT,
    attribution TEXT,
    total_appearances INTEGER DEFAULT 0,
    championship_wins INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: game_sessions
-- =============================================
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worldcup_id UUID NOT NULL,
    player_id UUID,
    session_token VARCHAR(255) NOT NULL,
    tournament_bracket JSONB NOT NULL,
    current_round INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    winner_item_id UUID,
    runner_up_item_id UUID,
    total_rounds INTEGER,
    total_matches INTEGER,
    play_time_seconds INTEGER,
    player_ip INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_worldcups_author_id ON worldcups(author_id);
CREATE INDEX IF NOT EXISTS idx_worldcups_category ON worldcups(category);
CREATE INDEX IF NOT EXISTS idx_worldcups_created_at ON worldcups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_worldcups_is_public ON worldcups(is_public);
CREATE INDEX IF NOT EXISTS idx_worldcups_search_vector ON worldcups USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_worldcup_items_worldcup_id ON worldcup_items(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_order_index ON worldcup_items(order_index);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_video_url ON worldcup_items(video_url);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_created_at ON worldcup_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_sessions_worldcup_id ON game_sessions(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_token ON game_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at DESC);

-- =============================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================
ALTER TABLE worldcups ADD CONSTRAINT fk_worldcups_author_id 
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE worldcup_items ADD CONSTRAINT fk_worldcup_items_worldcup_id 
    FOREIGN KEY (worldcup_id) REFERENCES worldcups(id) ON DELETE CASCADE;

ALTER TABLE game_sessions ADD CONSTRAINT fk_game_sessions_worldcup_id 
    FOREIGN KEY (worldcup_id) REFERENCES worldcups(id) ON DELETE CASCADE;

ALTER TABLE game_sessions ADD CONSTRAINT fk_game_sessions_player_id 
    FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE SET NULL;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_worldcups_updated_at 
    BEFORE UPDATE ON worldcups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worldcup_items_updated_at 
    BEFORE UPDATE ON worldcup_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();