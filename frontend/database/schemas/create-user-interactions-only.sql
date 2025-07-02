-- ================================================
-- 🚀 user_interactions 테이블 생성 (단독)
-- ================================================
-- 빠른 수정을 위한 단독 테이블 생성 스크립트

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- user_interactions 테이블 생성
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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_target ON user_interactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_type ON user_interactions(user_id, interaction_type);

-- RLS 활성화
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
DROP POLICY IF EXISTS "Users can manage own interactions" ON user_interactions;
CREATE POLICY "Users can manage own interactions" ON user_interactions
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view interactions" ON user_interactions;
CREATE POLICY "Anyone can view interactions" ON user_interactions
    FOR SELECT USING (true);

-- 통계 업데이트 트리거 함수
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
    
    -- 댓글 좋아요 수 업데이트 (comments 테이블이 있는 경우)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.target_type = 'comment' AND NEW.interaction_type = 'like' THEN
        -- comments 테이블이 있는지 확인
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
            UPDATE comments SET like_count = (
                SELECT COUNT(*) 
                FROM user_interactions 
                WHERE target_type = 'comment' 
                AND target_id = NEW.target_id 
                AND interaction_type = 'like'
            ) WHERE id = NEW.target_id;
        -- 구버전 테이블 업데이트 (호환성)
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worldcup_comments') THEN
            UPDATE worldcup_comments SET likes = (
                SELECT COUNT(*) 
                FROM user_interactions 
                WHERE target_type = 'comment' 
                AND target_id = NEW.target_id 
                AND interaction_type = 'like'
            ) WHERE id = NEW.target_id;
        END IF;
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
            -- comments 테이블이 있는 경우
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
                UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.target_id;
            -- 구버전 테이블 업데이트 (호환성)
            ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'worldcup_comments') THEN
                UPDATE worldcup_comments SET likes = GREATEST(0, likes - 1) WHERE id = OLD.target_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_interaction_counts ON user_interactions;
CREATE TRIGGER trigger_update_interaction_counts
    AFTER INSERT OR UPDATE OR DELETE ON user_interactions
    FOR EACH ROW EXECUTE FUNCTION update_interaction_counts();

-- 기존 데이터 마이그레이션 (구버전 테이블이 있는 경우)
DO $$
DECLARE
    migrated_count INTEGER := 0;
    temp_count INTEGER := 0;
BEGIN
    -- comment_likes에서 마이그레이션
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_likes') THEN
        INSERT INTO user_interactions (user_id, target_type, target_id, interaction_type, created_at)
        SELECT 
            user_id,
            'comment' as target_type,
            comment_id as target_id,
            'like' as interaction_type,
            created_at
        FROM comment_likes
        WHERE user_id IS NOT NULL AND comment_id IS NOT NULL
        ON CONFLICT (user_id, target_type, target_id, interaction_type) DO NOTHING;
        
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        migrated_count := migrated_count + temp_count;
        RAISE NOTICE '✅ 댓글 좋아요 마이그레이션: % 개', temp_count;
    END IF;
    
    -- user_likes에서 마이그레이션
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
        migrated_count := migrated_count + temp_count;
        RAISE NOTICE '✅ 월드컵 좋아요 마이그레이션: % 개', temp_count;
    END IF;
    
    -- user_bookmarks에서 마이그레이션
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_bookmarks') THEN
        INSERT INTO user_interactions (user_id, target_type, target_id, interaction_type, created_at)
        SELECT 
            user_id,
            'worldcup' as target_type,
            worldcup_id as target_id,
            'bookmark' as interaction_type,
            created_at
        FROM user_bookmarks
        WHERE user_id IS NOT NULL AND worldcup_id IS NOT NULL
        ON CONFLICT (user_id, target_type, target_id, interaction_type) DO NOTHING;
        
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        migrated_count := migrated_count + temp_count;
        RAISE NOTICE '✅ 북마크 마이그레이션: % 개', temp_count;
    END IF;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE '🎉 user_interactions 테이블 생성 및 마이그레이션 완료!';
    RAISE NOTICE '총 마이그레이션된 상호작용: % 개', migrated_count;
    RAISE NOTICE '================================================';
END $$;