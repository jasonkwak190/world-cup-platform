-- World Cup Platform RLS Policies
-- Generated: 2025-07-08
-- Source: MCP Database Query

-- =============================================
-- ENABLE RLS ON TABLES
-- =============================================
ALTER TABLE worldcups ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- WORLDCUPS TABLE RLS POLICIES
-- =============================================

-- SELECT Policy: Users can view public worldcups or their own worldcups
CREATE POLICY worldcups_select_policy ON worldcups
    FOR SELECT
    USING (is_public = true OR auth.uid() = author_id);

-- INSERT Policy: Authenticated users can create worldcups
CREATE POLICY worldcups_insert_policy ON worldcups
    FOR INSERT
    WITH CHECK (auth.uid() = author_id);

-- UPDATE Policy: Users can update their own worldcups
CREATE POLICY worldcups_update_policy ON worldcups
    FOR UPDATE
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

-- DELETE Policy: Users can delete their own worldcups
CREATE POLICY worldcups_delete_policy ON worldcups
    FOR DELETE
    USING (auth.uid() = author_id);

-- =============================================
-- WORLDCUP_ITEMS TABLE RLS POLICIES
-- =============================================

-- SELECT Policy: Users can view items from public worldcups or their own worldcups
CREATE POLICY worldcup_items_select_policy ON worldcup_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND (worldcups.is_public = true OR worldcups.author_id = auth.uid())
        )
    );

-- INSERT Policy: Users can add items to their own worldcups
CREATE POLICY worldcup_items_insert_policy ON worldcup_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.author_id = auth.uid()
        )
    );

-- UPDATE Policy: Users can update items in their own worldcups
CREATE POLICY worldcup_items_update_policy ON worldcup_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.author_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.author_id = auth.uid()
        )
    );

-- DELETE Policy: Users can delete items from their own worldcups
CREATE POLICY worldcup_items_delete_policy ON worldcup_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.author_id = auth.uid()
        )
    );

-- =============================================
-- USERS TABLE RLS POLICIES
-- =============================================

-- SELECT Policy: Users can view public user profiles
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (true);

-- UPDATE Policy: Users can update their own profile
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- INSERT Policy: Users can create their own profile (via auth trigger)
CREATE POLICY users_insert_policy ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- DELETE Policy: Users can delete their own profile
CREATE POLICY users_delete_policy ON users
    FOR DELETE
    USING (auth.uid() = id);

-- =============================================
-- GAME_SESSIONS TABLE RLS POLICIES
-- =============================================

-- SELECT Policy: Users can view their own game sessions or anonymous sessions
CREATE POLICY game_sessions_select_policy ON game_sessions
    FOR SELECT
    USING (auth.uid() = player_id OR player_id IS NULL);

-- INSERT Policy: Anyone can create game sessions
CREATE POLICY game_sessions_insert_policy ON game_sessions
    FOR INSERT
    WITH CHECK (true);

-- UPDATE Policy: Users can update their own game sessions or anonymous sessions
CREATE POLICY game_sessions_update_policy ON game_sessions
    FOR UPDATE
    USING (auth.uid() = player_id OR player_id IS NULL)
    WITH CHECK (auth.uid() = player_id OR player_id IS NULL);

-- DELETE Policy: Users can delete their own game sessions or anonymous sessions
CREATE POLICY game_sessions_delete_policy ON game_sessions
    FOR DELETE
    USING (auth.uid() = player_id OR player_id IS NULL);

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns the worldcup
CREATE OR REPLACE FUNCTION auth.owns_worldcup(worldcup_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM worldcups 
        WHERE id = worldcup_uuid 
        AND author_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ADDITIONAL SECURITY POLICIES
-- =============================================

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON worldcups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON worldcup_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON game_sessions TO authenticated;

-- Grant read-only access for anonymous users (for public content)
GRANT SELECT ON worldcups TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON worldcup_items TO anon;
GRANT SELECT, INSERT, UPDATE ON game_sessions TO anon;