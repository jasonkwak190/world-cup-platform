-- ================================================
-- 🚨 임시 RLS 비활성화 (테스트용)
-- ================================================
-- 주의: 이것은 임시 테스트용입니다. 실제 운영에서는 사용하지 마세요!

-- user_interactions 테이블의 RLS 임시 비활성화
ALTER TABLE user_interactions DISABLE ROW LEVEL SECURITY;

SELECT 'user_interactions 테이블 RLS 비활성화됨 - 테스트 후 다시 활성화하세요!' as warning;

-- 테스트 후 다시 활성화하려면:
-- ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;