-- ================================================
-- 🏆 랭킹 및 통계 뷰 생성 스크립트
-- ================================================
-- complete-migration-guide-fixed.sql과 data-migration-only.sql 실행 후에 실행하세요

-- ================================================
-- 월드컵 아이템 통계 뷰 (실시간 랭킹용)
-- ================================================

CREATE OR REPLACE VIEW worldcup_item_stats AS
SELECT 
    wi.id,
    wi.worldcup_id,
    wi.title,
    wi.image_url,
    wi.order_index as position,
    
    -- 게임 통계
    COALESCE(win_stats.win_count, 0) as win_count,
    COALESCE(lose_stats.lose_count, 0) as lose_count,
    COALESCE(total_stats.total_matches, 0) as total_matches,
    
    -- 승률 계산
    CASE 
        WHEN COALESCE(total_stats.total_matches, 0) = 0 THEN 0
        ELSE ROUND(
            COALESCE(win_stats.win_count, 0)::DECIMAL / total_stats.total_matches * 100, 2
        )
    END as win_rate,
    
    -- 최근 활동
    COALESCE(recent_stats.recent_matches, 0) as recent_matches_7days,
    COALESCE(recent_win_stats.recent_wins, 0) as recent_wins_7days,
    
    wi.created_at
    
FROM worldcup_items wi
LEFT JOIN (
    -- 승리 통계
    SELECT winner_id, COUNT(*) as win_count
    FROM game_matches
    GROUP BY winner_id
) win_stats ON wi.id = win_stats.winner_id
LEFT JOIN (
    -- 패배 통계
    SELECT 
        CASE 
            WHEN item1_id = winner_id THEN item2_id
            ELSE item1_id
        END as loser_id,
        COUNT(*) as lose_count
    FROM game_matches
    GROUP BY loser_id
) lose_stats ON wi.id = lose_stats.loser_id
LEFT JOIN (
    -- 전체 매치 통계
    SELECT item_id, COUNT(*) as total_matches
    FROM (
        SELECT item1_id as item_id FROM game_matches
        UNION ALL
        SELECT item2_id as item_id FROM game_matches
    ) all_matches
    GROUP BY item_id
) total_stats ON wi.id = total_stats.item_id
LEFT JOIN (
    -- 최근 7일 매치 통계
    SELECT item_id, COUNT(*) as recent_matches
    FROM (
        SELECT item1_id as item_id FROM game_matches WHERE created_at >= NOW() - INTERVAL '7 days'
        UNION ALL
        SELECT item2_id as item_id FROM game_matches WHERE created_at >= NOW() - INTERVAL '7 days'
    ) recent_matches
    GROUP BY item_id
) recent_stats ON wi.id = recent_stats.item_id
LEFT JOIN (
    -- 최근 7일 승리 통계
    SELECT winner_id, COUNT(*) as recent_wins
    FROM game_matches
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY winner_id
) recent_win_stats ON wi.id = recent_win_stats.winner_id;

-- ================================================
-- 월드컵별 인기 아이템 랭킹 뷰
-- ================================================

CREATE OR REPLACE VIEW worldcup_rankings AS
SELECT 
    worldcup_id,
    id as item_id,
    title,
    image_url,
    win_count,
    lose_count,
    total_matches,
    win_rate,
    ROW_NUMBER() OVER (
        PARTITION BY worldcup_id 
        ORDER BY win_rate DESC, win_count DESC, total_matches DESC
    ) as rank,
    recent_matches_7days,
    recent_wins_7days,
    position
FROM worldcup_item_stats
WHERE total_matches > 0
ORDER BY worldcup_id, rank;

-- ================================================
-- 전체 인기 아이템 랭킹 뷰 (월드컵 무관)
-- ================================================

CREATE OR REPLACE VIEW global_item_rankings AS
SELECT 
    wi.id,
    wi.worldcup_id,
    w.title as worldcup_title,
    wi.title as item_title,
    wi.image_url,
    stats.win_count,
    stats.lose_count,
    stats.total_matches,
    stats.win_rate,
    stats.recent_matches_7days,
    stats.recent_wins_7days,
    ROW_NUMBER() OVER (
        ORDER BY stats.win_rate DESC, stats.win_count DESC, stats.total_matches DESC
    ) as global_rank,
    wi.created_at
FROM worldcup_item_stats stats
JOIN worldcup_items wi ON wi.id = stats.id
JOIN worldcups w ON w.id = wi.worldcup_id
WHERE stats.total_matches >= 5  -- 최소 5게임 이상 플레이된 아이템만
AND w.status = 'published'
AND w.visibility = 'public'
ORDER BY global_rank;

-- ================================================
-- 월드컵 통계 뷰
-- ================================================

CREATE OR REPLACE VIEW worldcup_stats AS
SELECT 
    w.id,
    w.title,
    w.description,
    w.thumbnail_url,
    w.author_id,
    w.category_id,
    c.name as category_name,
    w.participants as play_count,
    w.likes as like_count,
    w.comments as comment_count,
    w.bookmark_count,
    
    -- 게임 세션 통계
    COALESCE(session_stats.total_sessions, 0) as total_game_sessions,
    COALESCE(session_stats.completed_sessions, 0) as completed_sessions,
    COALESCE(session_stats.avg_play_time, 0) as avg_play_time_seconds,
    
    -- 매치 통계
    COALESCE(match_stats.total_matches, 0) as total_matches,
    COALESCE(match_stats.avg_decision_time, 0) as avg_decision_time_ms,
    
    -- 최근 활동
    COALESCE(recent_activity.recent_sessions, 0) as recent_sessions_7days,
    COALESCE(recent_activity.recent_matches, 0) as recent_matches_7days,
    
    w.created_at,
    w.updated_at
    
FROM worldcups w
LEFT JOIN categories c ON c.id = w.category_id
LEFT JOIN (
    -- 게임 세션 통계
    SELECT 
        worldcup_id,
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
        AVG(play_time_seconds) FILTER (WHERE status = 'completed') as avg_play_time
    FROM game_sessions
    GROUP BY worldcup_id
) session_stats ON w.id = session_stats.worldcup_id
LEFT JOIN (
    -- 매치 통계
    SELECT 
        worldcup_id,
        COUNT(*) as total_matches,
        AVG(decision_time_ms) FILTER (WHERE decision_time_ms IS NOT NULL) as avg_decision_time
    FROM game_matches
    GROUP BY worldcup_id
) match_stats ON w.id = match_stats.worldcup_id
LEFT JOIN (
    -- 최근 7일 활동
    SELECT 
        gs.worldcup_id,
        COUNT(DISTINCT gs.id) as recent_sessions,
        COUNT(gm.id) as recent_matches
    FROM game_sessions gs
    LEFT JOIN game_matches gm ON gs.id = gm.session_id
    WHERE gs.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY gs.worldcup_id
) recent_activity ON w.id = recent_activity.worldcup_id;

-- ================================================
-- 사용자 활동 통계 뷰
-- ================================================

CREATE OR REPLACE VIEW user_activity_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.profile_image_url,
    u.role,
    
    -- 월드컵 관련 통계
    COALESCE(worldcup_stats.created_worldcups, 0) as created_worldcups,
    COALESCE(worldcup_stats.avg_worldcup_popularity, 0) as avg_worldcup_popularity,
    
    -- 게임 플레이 통계
    COALESCE(game_stats.total_games_played, 0) as total_games_played,
    COALESCE(game_stats.completed_games, 0) as completed_games,
    COALESCE(game_stats.avg_game_time, 0) as avg_game_time_seconds,
    
    -- 상호작용 통계
    COALESCE(interaction_stats.total_likes_given, 0) as total_likes_given,
    COALESCE(interaction_stats.total_bookmarks, 0) as total_bookmarks,
    COALESCE(interaction_stats.total_comments, 0) as total_comments,
    
    -- 받은 상호작용 통계
    COALESCE(received_stats.total_likes_received, 0) as total_likes_received,
    COALESCE(received_stats.total_comments_received, 0) as total_comments_received,
    
    u.created_at,
    u.last_login_at
    
FROM users u
LEFT JOIN (
    -- 생성한 월드컵 통계
    SELECT 
        author_id,
        COUNT(*) as created_worldcups,
        AVG(participants) as avg_worldcup_popularity
    FROM worldcups
    WHERE status = 'published'
    GROUP BY author_id
) worldcup_stats ON u.id = worldcup_stats.author_id
LEFT JOIN (
    -- 게임 플레이 통계
    SELECT 
        player_id,
        COUNT(*) as total_games_played,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_games,
        AVG(play_time_seconds) FILTER (WHERE status = 'completed') as avg_game_time
    FROM game_sessions
    WHERE player_id IS NOT NULL
    GROUP BY player_id
) game_stats ON u.id = game_stats.player_id
LEFT JOIN (
    -- 상호작용 통계 (본인이 한 것)
    SELECT 
        user_id,
        COUNT(*) FILTER (WHERE interaction_type = 'like') as total_likes_given,
        COUNT(*) FILTER (WHERE interaction_type = 'bookmark') as total_bookmarks,
        0 as total_comments  -- 댓글은 별도 테이블이므로 일단 0
    FROM user_interactions
    GROUP BY user_id
) interaction_stats ON u.id = interaction_stats.user_id
LEFT JOIN (
    -- 받은 상호작용 통계
    SELECT 
        w.author_id,
        COUNT(ui.id) FILTER (WHERE ui.interaction_type = 'like') as total_likes_received,
        COUNT(c.id) as total_comments_received
    FROM worldcups w
    LEFT JOIN user_interactions ui ON ui.target_type = 'worldcup' AND ui.target_id = w.id
    LEFT JOIN comments c ON c.worldcup_id = w.id AND c.is_deleted = FALSE
    GROUP BY w.author_id
) received_stats ON u.id = received_stats.author_id;

-- ================================================
-- 트렌딩 월드컵 뷰
-- ================================================

CREATE OR REPLACE VIEW trending_worldcups AS
SELECT 
    w.id,
    w.title,
    w.description,
    w.thumbnail_url,
    w.author_id,
    u.username as author_name,
    w.category_id,
    c.name as category_name,
    
    -- 기본 통계
    w.participants as total_plays,
    w.likes as total_likes,
    w.comments as total_comments,
    
    -- 최근 7일 활동
    COALESCE(recent_activity.recent_plays, 0) as recent_plays_7days,
    COALESCE(recent_activity.recent_likes, 0) as recent_likes_7days,
    COALESCE(recent_activity.recent_comments, 0) as recent_comments_7days,
    
    -- 트렌드 점수 계산 (가중치 적용)
    (
        COALESCE(recent_activity.recent_plays, 0) * 1.0 +
        COALESCE(recent_activity.recent_likes, 0) * 2.0 +
        COALESCE(recent_activity.recent_comments, 0) * 3.0
    ) as trend_score,
    
    w.created_at,
    w.updated_at
    
FROM worldcups w
JOIN users u ON u.id = w.author_id
LEFT JOIN categories c ON c.id = w.category_id
LEFT JOIN (
    -- 최근 7일 활동 통계
    SELECT 
        sub_w.id as worldcup_id,
        COUNT(DISTINCT gs.id) as recent_plays,
        COUNT(DISTINCT ui.id) FILTER (WHERE ui.interaction_type = 'like') as recent_likes,
        COUNT(DISTINCT com.id) as recent_comments
    FROM worldcups sub_w
    LEFT JOIN game_sessions gs ON sub_w.id = gs.worldcup_id 
        AND gs.created_at >= NOW() - INTERVAL '7 days'
    LEFT JOIN user_interactions ui ON sub_w.id = ui.target_id 
        AND ui.target_type = 'worldcup' 
        AND ui.interaction_type = 'like'
        AND ui.created_at >= NOW() - INTERVAL '7 days'
    LEFT JOIN comments com ON sub_w.id = com.worldcup_id 
        AND com.is_deleted = FALSE 
        AND com.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY sub_w.id
) recent_activity ON w.id = recent_activity.worldcup_id
WHERE w.status = 'published' 
AND w.visibility = 'public'
ORDER BY trend_score DESC, w.created_at DESC;

-- ================================================
-- 완료 메시지
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '🏆 랭킹 및 통계 뷰 생성 완료!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '생성된 뷰:';
    RAISE NOTICE '- worldcup_item_stats (아이템 통계)';
    RAISE NOTICE '- worldcup_rankings (월드컵별 랭킹)';
    RAISE NOTICE '- global_item_rankings (전체 아이템 랭킹)';
    RAISE NOTICE '- worldcup_stats (월드컵 통계)';
    RAISE NOTICE '- user_activity_stats (사용자 활동 통계)';
    RAISE NOTICE '- trending_worldcups (트렌딩 월드컵)';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '사용 예시:';
    RAISE NOTICE 'SELECT * FROM worldcup_rankings WHERE worldcup_id = ''your-id'' LIMIT 10;';
    RAISE NOTICE 'SELECT * FROM trending_worldcups LIMIT 20;';
    RAISE NOTICE 'SELECT * FROM global_item_rankings LIMIT 50;';
    RAISE NOTICE '==================================================';
END $$;