-- ================================================
-- 🔧 실시간 기능을 위한 RLS 정책 수정
-- ================================================
-- 실시간 구독 에러 해결을 위한 RLS 정책 수정

-- 1. worldcups 테이블 RLS 정책 수정
DROP POLICY IF EXISTS "Public worldcups are viewable by everyone" ON worldcups;
DROP POLICY IF EXISTS "Users can view worldcups" ON worldcups;
DROP POLICY IF EXISTS "Anyone can view public worldcups" ON worldcups;

-- 모든 사용자(인증/비인증)가 public 월드컵을 볼 수 있도록 허용
CREATE POLICY "Enable read access for public worldcups" ON worldcups
    FOR SELECT USING (is_public = true OR auth.uid() = author_id);

-- 2. comments 테이블 RLS 정책 수정  
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;

-- 모든 사용자가 댓글을 볼 수 있도록 허용
CREATE POLICY "Enable read access for comments" ON comments
    FOR SELECT USING (true);

-- 3. user_interactions 테이블 RLS 정책은 이미 수정됨 (이전 스크립트에서)

-- 4. 실시간 기능 활성화 확인
ALTER TABLE worldcups ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- 실시간 발행 활성화
ALTER publication supabase_realtime ADD TABLE worldcups;
ALTER publication supabase_realtime ADD TABLE comments;
ALTER publication supabase_realtime ADD TABLE user_interactions;

-- 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('worldcups', 'comments', 'user_interactions')
ORDER BY tablename, cmd, policyname;

-- 현재 RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('worldcups', 'comments', 'user_interactions');

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ 실시간 기능을 위한 RLS 정책 수정 완료';
    RAISE NOTICE '================================================';
    RAISE NOTICE '변경사항:';
    RAISE NOTICE '- worldcups: 공개 월드컵 모든 사용자 읽기 허용';
    RAISE NOTICE '- comments: 모든 댓글 읽기 허용';
    RAISE NOTICE '- 실시간 발행 활성화';
    RAISE NOTICE '================================================';
END $$;