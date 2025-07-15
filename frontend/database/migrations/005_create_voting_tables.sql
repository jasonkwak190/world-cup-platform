-- Migration: Create voting and statistics tables
-- This migration creates tables for tracking votes and item statistics

-- Create worldcup_votes table
CREATE TABLE IF NOT EXISTS worldcup_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    winner_id UUID NOT NULL REFERENCES worldcup_items(id) ON DELETE CASCADE,
    loser_id UUID NOT NULL REFERENCES worldcup_items(id) ON DELETE CASCADE,
    round_type VARCHAR(10) DEFAULT '16',
    session_id UUID DEFAULT NULL,
    user_ip VARCHAR(45) DEFAULT NULL,
    user_id UUID DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_worldcup_id ON worldcup_votes(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_winner_id ON worldcup_votes(winner_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_loser_id ON worldcup_votes(loser_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_voted_at ON worldcup_votes(voted_at);
CREATE INDEX IF NOT EXISTS idx_worldcup_votes_session_id ON worldcup_votes(session_id);

-- Create worldcup_item_stats table for caching statistics
CREATE TABLE IF NOT EXISTS worldcup_item_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES worldcup_items(id) ON DELETE CASCADE,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    total_battles INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(worldcup_id, item_id)
);

-- Create indexes for item stats
CREATE INDEX IF NOT EXISTS idx_worldcup_item_stats_worldcup_id ON worldcup_item_stats(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_item_stats_item_id ON worldcup_item_stats(item_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_item_stats_win_rate ON worldcup_item_stats(win_rate);

-- Create functions for updating item statistics
CREATE OR REPLACE FUNCTION increment_item_wins(item_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO worldcup_item_stats (worldcup_id, item_id, wins, total_battles, win_rate)
    SELECT 
        w.worldcup_id,
        item_id,
        1,
        1,
        100.00
    FROM worldcup_items w
    WHERE w.id = item_id
    ON CONFLICT (worldcup_id, item_id) 
    DO UPDATE SET 
        wins = worldcup_item_stats.wins + 1,
        total_battles = worldcup_item_stats.total_battles + 1,
        win_rate = CASE 
            WHEN worldcup_item_stats.total_battles + 1 > 0 
            THEN (worldcup_item_stats.wins + 1) * 100.0 / (worldcup_item_stats.total_battles + 1)
            ELSE 0.00 
        END,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_item_losses(item_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO worldcup_item_stats (worldcup_id, item_id, losses, total_battles, win_rate)
    SELECT 
        w.worldcup_id,
        item_id,
        1,
        1,
        0.00
    FROM worldcup_items w
    WHERE w.id = item_id
    ON CONFLICT (worldcup_id, item_id) 
    DO UPDATE SET 
        losses = worldcup_item_stats.losses + 1,
        total_battles = worldcup_item_stats.total_battles + 1,
        win_rate = CASE 
            WHEN worldcup_item_stats.total_battles + 1 > 0 
            THEN worldcup_item_stats.wins * 100.0 / (worldcup_item_stats.total_battles + 1)
            ELSE 0.00 
        END,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to recalculate all item statistics
CREATE OR REPLACE FUNCTION recalculate_item_stats(worldcup_id_param UUID)
RETURNS VOID AS $$
BEGIN
    -- Clear existing stats for this worldcup
    DELETE FROM worldcup_item_stats WHERE worldcup_id = worldcup_id_param;
    
    -- Recalculate from votes
    INSERT INTO worldcup_item_stats (worldcup_id, item_id, wins, losses, total_battles, win_rate)
    SELECT 
        worldcup_id_param,
        item_id,
        COALESCE(wins, 0) as wins,
        COALESCE(losses, 0) as losses,
        COALESCE(wins, 0) + COALESCE(losses, 0) as total_battles,
        CASE 
            WHEN COALESCE(wins, 0) + COALESCE(losses, 0) > 0 
            THEN COALESCE(wins, 0) * 100.0 / (COALESCE(wins, 0) + COALESCE(losses, 0))
            ELSE 0.00 
        END as win_rate
    FROM (
        SELECT 
            wi.id as item_id,
            COUNT(CASE WHEN wv.winner_id = wi.id THEN 1 END) as wins,
            COUNT(CASE WHEN wv.loser_id = wi.id THEN 1 END) as losses
        FROM worldcup_items wi
        LEFT JOIN worldcup_votes wv ON (wv.winner_id = wi.id OR wv.loser_id = wi.id)
        WHERE wi.worldcup_id = worldcup_id_param
        GROUP BY wi.id
    ) stats;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update worldcup stats when votes are added
CREATE OR REPLACE FUNCTION update_worldcup_stats_on_vote()
RETURNS TRIGGER AS $$
BEGIN
    -- Update worldcup participants count (could be used for unique sessions)
    UPDATE worldcups 
    SET participants = participants + 1
    WHERE id = NEW.worldcup_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_worldcup_stats_on_vote') THEN
        CREATE TRIGGER trigger_update_worldcup_stats_on_vote
            AFTER INSERT ON worldcup_votes
            FOR EACH ROW
            EXECUTE FUNCTION update_worldcup_stats_on_vote();
    END IF;
END
$$;

-- Row Level Security (RLS) policies
ALTER TABLE worldcup_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcup_item_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read votes (for statistics)
CREATE POLICY "Anyone can read votes" ON worldcup_votes
    FOR SELECT USING (true);

-- Policy: Anyone can insert votes (for gameplay)
CREATE POLICY "Anyone can insert votes" ON worldcup_votes
    FOR INSERT WITH CHECK (true);

-- Policy: Anyone can read item stats
CREATE POLICY "Anyone can read item stats" ON worldcup_item_stats
    FOR SELECT USING (true);

-- Policy: System can update item stats
CREATE POLICY "System can update item stats" ON worldcup_item_stats
    FOR ALL USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON worldcup_votes TO anon, authenticated;
GRANT SELECT ON worldcup_item_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_item_wins(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_item_losses(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION recalculate_item_stats(UUID) TO authenticated;