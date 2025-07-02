-- ================================================
-- 🔧 검색 벡터 함수 수정
-- ================================================
-- 한국어 텍스트 검색 설정을 기본 설정으로 변경

-- 기존 트리거 제거
DROP TRIGGER IF EXISTS trigger_update_worldcup_search_vector ON worldcups;

-- 검색 벡터 업데이트 함수 재생성 (simple 설정 사용)
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

-- 트리거 재생성
CREATE TRIGGER trigger_update_worldcup_search_vector
    BEFORE INSERT OR UPDATE ON worldcups
    FOR EACH ROW EXECUTE FUNCTION update_worldcup_search_vector();

DO $$
BEGIN
    RAISE NOTICE '✅ 검색 벡터 함수 수정 완료 (simple 설정 사용)';
    RAISE NOTICE '이제 data-migration-only-fixed.sql을 다시 실행하세요';
END $$;