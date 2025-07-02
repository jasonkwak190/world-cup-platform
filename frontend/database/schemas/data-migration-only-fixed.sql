-- ================================================
-- 🔄 데이터 마이그레이션 전용 스크립트 (수정된 버전)
-- ================================================
-- complete-migration-guide-fixed.sql 실행 후에 이 파일을 실행하세요

-- ================================================
-- STEP 1: 백업 생성
-- ================================================

-- 백업 테이블 생성 (안전장치)
DO $$
BEGIN
    -- 백업 테이블들 생성
    EXECUTE 'CREATE TABLE IF NOT EXISTS backup_worldcups AS SELECT * FROM worldcups';
    EXECUTE 'CREATE TABLE IF NOT EXISTS backup_users AS SELECT * FROM users';
    EXECUTE 'CREATE TABLE IF NOT EXISTS backup_worldcup_comments AS SELECT * FROM worldcup_comments';
    EXECUTE 'CREATE TABLE IF NOT EXISTS backup_comment_likes AS SELECT * FROM comment_likes';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worldcup_likes') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_worldcup_likes AS SELECT * FROM worldcup_likes';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_bookmarks') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_user_bookmarks AS SELECT * FROM user_bookmarks';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worldcup_bookmarks') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS backup_worldcup_bookmarks AS SELECT * FROM worldcup_bookmarks';
    END IF;
    
    RAISE NOTICE '✅ 백업 테이블 생성 완료';
END $$;

-- ================================================
-- STEP 2: 기존 데이터 마이그레이션
-- ================================================

-- 댓글 데이터 마이그레이션 (worldcup_comments -> comments)
DO $$
DECLARE
    comment_count INTEGER;
BEGIN
    INSERT INTO comments (
        id, worldcup_id, author_id, parent_id, content, 
        guest_name, guest_session_id, like_count, created_at, updated_at
    )
    SELECT 
        id,
        worldcup_id,
        user_id as author_id,
        parent_id,
        content,
        -- 기존 데이터 정리: username이 NULL이면 기본값 설정
        CASE 
            WHEN user_id IS NULL AND username IS NULL THEN '익명사용자'
            ELSE username 
        END as guest_name,
        -- guest_session_id가 NULL이면 기본값 생성
        CASE 
            WHEN user_id IS NULL AND guest_session_id IS NULL THEN 'legacy-' || id::text
            ELSE guest_session_id 
        END as guest_session_id,
        COALESCE(likes, 0) as like_count,
        created_at,
        updated_at
    FROM worldcup_comments
    ON CONFLICT (id) DO NOTHING;
    
    GET DIAGNOSTICS comment_count = ROW_COUNT;
    RAISE NOTICE '✅ 댓글 마이그레이션 완료: % 개', comment_count;
END $$;

-- 댓글 좋아요 마이그레이션 (comment_likes -> user_interactions)
DO $$
DECLARE
    like_count INTEGER;
BEGIN
    INSERT INTO user_interactions (id, user_id, target_type, target_id, interaction_type, created_at)
    SELECT 
        id,
        user_id,
        'comment' as target_type,
        comment_id as target_id,
        'like' as interaction_type,
        created_at
    FROM comment_likes
    WHERE user_id IS NOT NULL AND comment_id IS NOT NULL
    ON CONFLICT (user_id, target_type, target_id, interaction_type) DO NOTHING;
    
    GET DIAGNOSTICS like_count = ROW_COUNT;
    RAISE NOTICE '✅ 댓글 좋아요 마이그레이션 완료: % 개', like_count;
END $$;

-- 월드컵 좋아요 마이그레이션
DO $$
DECLARE
    worldcup_like_count INTEGER := 0;
    temp_count INTEGER := 0;
BEGIN
    -- worldcup_likes 테이블이 존재하는 경우
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worldcup_likes') THEN
        INSERT INTO user_interactions (id, user_id, target_type, target_id, interaction_type, created_at)
        SELECT 
            id,
            user_id,
            'worldcup' as target_type,
            worldcup_id as target_id,
            'like' as interaction_type,
            created_at
        FROM worldcup_likes
        WHERE user_id IS NOT NULL AND worldcup_id IS NOT NULL
        ON CONFLICT (user_id, target_type, target_id, interaction_type) DO NOTHING;
        
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        worldcup_like_count := worldcup_like_count + temp_count;
    END IF;
    
    -- user_likes 테이블이 존재하는 경우
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_likes') THEN
        INSERT INTO user_interactions (user_id, target_type, target_id, interaction_type, created_at)
        SELECT 
            user_id,
            'worldcup' as target_type,
            worldcup_id as target_id,
            'like' as interaction_type,
            created_at
        FROM user_likes
        WHERE user_id IS NOT NULL AND worldcup_id IS NOT NULL
        ON CONFLICT (user_id, target_type, target_id, interaction_type) DO NOTHING;
        
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        worldcup_like_count := worldcup_like_count + temp_count;
    END IF;
    
    RAISE NOTICE '✅ 월드컵 좋아요 마이그레이션 완료: % 개', worldcup_like_count;
END $$;

-- 북마크 마이그레이션
DO $$
DECLARE
    bookmark_count INTEGER := 0;
    temp_count INTEGER := 0;
BEGIN
    -- user_bookmarks 테이블이 존재하는 경우
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_bookmarks') THEN
        INSERT INTO user_interactions (id, user_id, target_type, target_id, interaction_type, created_at)
        SELECT 
            id,
            user_id,
            'worldcup' as target_type,
            worldcup_id as target_id,
            'bookmark' as interaction_type,
            created_at
        FROM user_bookmarks
        WHERE user_id IS NOT NULL AND worldcup_id IS NOT NULL
        ON CONFLICT (user_id, target_type, target_id, interaction_type) DO NOTHING;
        
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        bookmark_count := bookmark_count + temp_count;
    END IF;
    
    -- worldcup_bookmarks 테이블이 존재하는 경우
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worldcup_bookmarks') THEN
        INSERT INTO user_interactions (id, user_id, target_type, target_id, interaction_type, created_at)
        SELECT 
            id,
            user_id,
            'worldcup' as target_type,
            worldcup_id as target_id,
            'bookmark' as interaction_type,
            created_at
        FROM worldcup_bookmarks
        WHERE user_id IS NOT NULL AND worldcup_id IS NOT NULL
        ON CONFLICT (user_id, target_type, target_id, interaction_type) DO NOTHING;
        
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        bookmark_count := bookmark_count + temp_count;
    END IF;
    
    RAISE NOTICE '✅ 북마크 마이그레이션 완료: % 개', bookmark_count;
END $$;

-- 게임 결과 마이그레이션 (game_results -> game_sessions)
DO $$
DECLARE
    session_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_results') THEN
        INSERT INTO game_sessions (
            id, worldcup_id, player_id, status, winner_item_id, runner_up_item_id,
            total_rounds, play_time_seconds, player_ip, created_at, completed_at
        )
        SELECT 
            id,
            worldcup_id,
            user_id as player_id,
            'completed' as status,
            winner_item_id,
            runner_up_item_id,
            rounds_played as total_rounds,
            play_time_seconds,
            user_ip as player_ip,
            created_at,
            created_at as completed_at
        FROM game_results
        ON CONFLICT (id) DO NOTHING;
        
        GET DIAGNOSTICS session_count = ROW_COUNT;
    END IF;
    
    RAISE NOTICE '✅ 게임 세션 마이그레이션 완료: % 개', session_count;
END $$;

-- ================================================
-- STEP 3: 월드컵 데이터 업데이트
-- ================================================

-- 카테고리 매핑 (기존 category 문자열을 새 category_id로 매핑)
DO $$
BEGIN
    UPDATE worldcups SET category_id = (
        CASE 
            WHEN category = 'entertainment' THEN (SELECT id FROM categories WHERE slug = 'entertainment')
            WHEN category = 'food' THEN (SELECT id FROM categories WHERE slug = 'food')
            WHEN category = 'sports' THEN (SELECT id FROM categories WHERE slug = 'sports')
            WHEN category = 'games' THEN (SELECT id FROM categories WHERE slug = 'games')
            WHEN category = 'movies' THEN (SELECT id FROM categories WHERE slug = 'movies')
            WHEN category = 'fashion' THEN (SELECT id FROM categories WHERE slug = 'fashion')
            WHEN category = 'travel' THEN (SELECT id FROM categories WHERE slug = 'travel')
            ELSE (SELECT id FROM categories WHERE slug = 'others')
        END
    ) WHERE category_id IS NULL;
    
    RAISE NOTICE '✅ 월드컵 카테고리 매핑 완료';
END $$;

-- slug 생성 (제목 기반, 중복 방지)
DO $$
DECLARE
    worldcup_record RECORD;
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER;
BEGIN
    FOR worldcup_record IN 
        SELECT id, title FROM worldcups WHERE slug IS NULL
    LOOP
        -- 기본 slug 생성
        base_slug := LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(worldcup_record.title, '[^a-zA-Z0-9가-힣\s-]', '', 'g'),
                '\s+', '-', 'g'
            )
        );
        
        -- 길이 제한 (50자)
        IF LENGTH(base_slug) > 50 THEN
            base_slug := SUBSTRING(base_slug, 1, 50);
        END IF;
        
        -- 중복 확인 및 번호 추가
        final_slug := base_slug;
        counter := 1;
        
        WHILE EXISTS (SELECT 1 FROM worldcups WHERE slug = final_slug) LOOP
            final_slug := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;
        
        -- 최종 slug에 ID 추가 (고유성 보장)
        final_slug := final_slug || '-' || SUBSTRING(worldcup_record.id::text, 1, 8);
        
        UPDATE worldcups SET slug = final_slug WHERE id = worldcup_record.id;
    END LOOP;
    
    RAISE NOTICE '✅ 월드컵 slug 생성 완료';
END $$;

-- ================================================
-- STEP 4: 통계 재계산
-- ================================================

-- 댓글 수 재계산
UPDATE worldcups SET comments = (
    SELECT COUNT(*) 
    FROM comments 
    WHERE comments.worldcup_id = worldcups.id 
    AND is_deleted = FALSE
) WHERE comments != (
    SELECT COUNT(*) 
    FROM comments 
    WHERE comments.worldcup_id = worldcups.id 
    AND is_deleted = FALSE
);

-- 좋아요 수 재계산
UPDATE worldcups SET likes = (
    SELECT COUNT(*) 
    FROM user_interactions 
    WHERE target_type = 'worldcup' 
    AND target_id = worldcups.id 
    AND interaction_type = 'like'
) WHERE likes != (
    SELECT COUNT(*) 
    FROM user_interactions 
    WHERE target_type = 'worldcup' 
    AND target_id = worldcups.id 
    AND interaction_type = 'like'
);

-- 북마크 수 계산
UPDATE worldcups SET bookmark_count = (
    SELECT COUNT(*) 
    FROM user_interactions 
    WHERE target_type = 'worldcup' 
    AND target_id = worldcups.id 
    AND interaction_type = 'bookmark'
) WHERE bookmark_count IS NULL OR bookmark_count != (
    SELECT COUNT(*) 
    FROM user_interactions 
    WHERE target_type = 'worldcup' 
    AND target_id = worldcups.id 
    AND interaction_type = 'bookmark'
);

-- 댓글 좋아요 수 재계산
UPDATE comments SET like_count = (
    SELECT COUNT(*) 
    FROM user_interactions 
    WHERE target_type = 'comment' 
    AND target_id = comments.id 
    AND interaction_type = 'like'
) WHERE like_count != (
    SELECT COUNT(*) 
    FROM user_interactions 
    WHERE target_type = 'comment' 
    AND target_id = comments.id 
    AND interaction_type = 'like'
);

-- 댓글 대댓글 수 재계산
UPDATE comments SET reply_count = (
    SELECT COUNT(*) 
    FROM comments replies
    WHERE replies.parent_id = comments.id 
    AND replies.is_deleted = FALSE
) WHERE parent_id IS NULL; -- 최상위 댓글만

DO $$
BEGIN
    RAISE NOTICE '✅ 통계 재계산 완료';
END $$;

-- ================================================
-- STEP 5: 데이터 검증
-- ================================================

DO $$
DECLARE
    old_comment_count INTEGER;
    new_comment_count INTEGER;
    old_like_count INTEGER;
    new_like_count INTEGER;
    old_worldcup_count INTEGER;
    new_worldcup_count INTEGER;
BEGIN
    -- 댓글 수 검증
    SELECT COUNT(*) INTO old_comment_count FROM worldcup_comments;
    SELECT COUNT(*) INTO new_comment_count FROM comments;
    
    IF old_comment_count = new_comment_count THEN
        RAISE NOTICE '✅ 댓글 마이그레이션 검증 성공: % 개', new_comment_count;
    ELSE
        RAISE WARNING '⚠️ 댓글 수 불일치: 기존 %, 새로운 %', old_comment_count, new_comment_count;
    END IF;
    
    -- 댓글 좋아요 수 검증
    SELECT COUNT(*) INTO old_like_count FROM comment_likes;
    SELECT COUNT(*) INTO new_like_count 
    FROM user_interactions 
    WHERE target_type = 'comment' AND interaction_type = 'like';
    
    IF old_like_count = new_like_count THEN
        RAISE NOTICE '✅ 댓글 좋아요 마이그레이션 검증 성공: % 개', new_like_count;
    ELSE
        RAISE WARNING '⚠️ 댓글 좋아요 수 불일치: 기존 %, 새로운 %', old_like_count, new_like_count;
    END IF;
    
    -- 월드컵 수 검증
    SELECT COUNT(*) INTO old_worldcup_count FROM worldcups WHERE slug IS NULL;
    SELECT COUNT(*) INTO new_worldcup_count FROM worldcups WHERE category_id IS NULL;
    
    IF old_worldcup_count = 0 AND new_worldcup_count = 0 THEN
        RAISE NOTICE '✅ 월드컵 데이터 업데이트 검증 성공';
    ELSE
        RAISE WARNING '⚠️ 월드컵 데이터 업데이트 불완전: slug 없음 %, category_id 없음 %', old_worldcup_count, new_worldcup_count;
    END IF;
    
    -- 통계 검증
    RAISE NOTICE '📊 마이그레이션 통계:';
    RAISE NOTICE '- 전체 댓글: %', (SELECT COUNT(*) FROM comments);
    RAISE NOTICE '- 전체 상호작용: %', (SELECT COUNT(*) FROM user_interactions);
    RAISE NOTICE '- 월드컵 좋아요: %', (SELECT COUNT(*) FROM user_interactions WHERE target_type = 'worldcup' AND interaction_type = 'like');
    RAISE NOTICE '- 월드컵 북마크: %', (SELECT COUNT(*) FROM user_interactions WHERE target_type = 'worldcup' AND interaction_type = 'bookmark');
    RAISE NOTICE '- 카테고리: %', (SELECT COUNT(*) FROM categories);
END $$;

-- ================================================
-- STEP 6: 최종 정리
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '🎉 데이터 마이그레이션 완료!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ 완료된 작업:';
    RAISE NOTICE '- 백업 테이블 생성';
    RAISE NOTICE '- 댓글 데이터 마이그레이션';
    RAISE NOTICE '- 좋아요/북마크 데이터 통합';
    RAISE NOTICE '- 게임 결과 마이그레이션';
    RAISE NOTICE '- 월드컵 메타데이터 업데이트';
    RAISE NOTICE '- 통계 재계산';
    RAISE NOTICE '- 데이터 검증 완료';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '📋 다음 단계:';
    RAISE NOTICE '1. create-ranking-views.sql 실행';
    RAISE NOTICE '2. 애플리케이션 코드 업데이트';
    RAISE NOTICE '3. 기능 테스트 수행';
    RAISE NOTICE '4. 프로덕션 배포';
    RAISE NOTICE '==================================================';
END $$;