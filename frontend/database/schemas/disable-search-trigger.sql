-- ================================================
-- 🔧 검색 벡터 트리거 비활성화 (임시)
-- ================================================
-- 마이그레이션 중 오류를 방지하기 위해 검색 트리거를 비활성화

-- 검색 벡터 트리거 제거
DROP TRIGGER IF EXISTS trigger_update_worldcup_search_vector ON worldcups;

-- 검색 벡터 함수도 제거 (필요시)
DROP FUNCTION IF EXISTS update_worldcup_search_vector();

DO $$
BEGIN
    RAISE NOTICE '✅ 검색 벡터 트리거 비활성화 완료';
    RAISE NOTICE '마이그레이션 완료 후 필요시 다시 활성화하세요';
    RAISE NOTICE '이제 data-migration-only-fixed.sql을 다시 실행하세요';
END $$;