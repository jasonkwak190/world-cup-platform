-- Migration: Create autosave tables for worldcup play progress
-- This migration creates tables for tracking worldcup play progress and draft saves

-- Create worldcup_play_saves table (authenticated users only)
CREATE TABLE IF NOT EXISTS worldcup_play_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    worldcup_id UUID NOT NULL REFERENCES worldcups(id) ON DELETE CASCADE,
    current_round INTEGER NOT NULL,
    total_rounds INTEGER NOT NULL,
    bracket_state JSONB NOT NULL,
    remaining_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    selected_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    round_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(user_id, worldcup_id) -- One save per user per worldcup
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_worldcup_play_saves_user_id ON worldcup_play_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_play_saves_worldcup_id ON worldcup_play_saves(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_play_saves_expires_at ON worldcup_play_saves(expires_at);
CREATE INDEX IF NOT EXISTS idx_worldcup_play_saves_updated_at ON worldcup_play_saves(updated_at);

-- Create worldcup_draft_saves table for worldcup creation drafts
CREATE TABLE IF NOT EXISTS worldcup_draft_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT,
    description TEXT,
    category VARCHAR(50),
    items JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    image_files JSONB DEFAULT '[]'::jsonb, -- Supabase Storage file paths
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for draft saves
CREATE INDEX IF NOT EXISTS idx_worldcup_draft_saves_user_id ON worldcup_draft_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_draft_saves_updated_at ON worldcup_draft_saves(updated_at);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER trigger_update_play_saves_updated_at
    BEFORE UPDATE ON worldcup_play_saves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_draft_saves_updated_at
    BEFORE UPDATE ON worldcup_draft_saves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired saves
CREATE OR REPLACE FUNCTION cleanup_expired_saves()
RETURNS VOID AS $$
BEGIN
    -- Delete expired play saves (30 days for authenticated users)
    DELETE FROM worldcup_play_saves 
    WHERE expires_at < NOW();
    
    -- Delete old draft saves (30 days)
    DELETE FROM worldcup_draft_saves 
    WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE worldcup_play_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcup_draft_saves ENABLE ROW LEVEL SECURITY;

-- Policies for worldcup_play_saves
-- Users can only access their own play saves (authenticated users only)
CREATE POLICY "Users can read their own play saves" ON worldcup_play_saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own play saves" ON worldcup_play_saves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own play saves" ON worldcup_play_saves
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own play saves" ON worldcup_play_saves
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for worldcup_draft_saves
-- Users can only access their own draft saves
CREATE POLICY "Users can read their own draft saves" ON worldcup_draft_saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own draft saves" ON worldcup_draft_saves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft saves" ON worldcup_draft_saves
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own draft saves" ON worldcup_draft_saves
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions (authenticated users only)
GRANT SELECT, INSERT, UPDATE, DELETE ON worldcup_play_saves TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON worldcup_draft_saves TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_saves() TO authenticated;