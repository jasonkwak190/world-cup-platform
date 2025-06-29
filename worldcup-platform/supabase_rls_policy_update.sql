-- worldcup_comments 테이블에 비회원 댓글 작성을 허용하는 RLS 정책 추가

-- 기존 INSERT 정책이 있다면 먼저 삭제
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON worldcup_comments;
DROP POLICY IF EXISTS "Enable insert for all users" ON worldcup_comments;

-- 모든 사용자(인증된 사용자 + 비회원)가 댓글 작성할 수 있도록 허용
CREATE POLICY "Enable insert for all users including guests" ON worldcup_comments
FOR INSERT WITH CHECK (true);

-- 읽기 정책 (모든 사용자가 댓글을 볼 수 있음)
DROP POLICY IF EXISTS "Enable read for all users" ON worldcup_comments;
CREATE POLICY "Enable read for all users" ON worldcup_comments
FOR SELECT USING (true);

-- 업데이트 정책 (본인이 작성한 댓글만 수정 가능, 회원만)
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON worldcup_comments;
CREATE POLICY "Enable update for users based on user_id" ON worldcup_comments
FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- 삭제 정책 (본인이 작성한 댓글 또는 비회원 댓글은 누구나 삭제 가능)
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON worldcup_comments;
CREATE POLICY "Enable delete for users based on user_id or guest comments" ON worldcup_comments
FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- comment_likes 테이블 정책 (좋아요는 로그인한 사용자만)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON comment_likes;
CREATE POLICY "Enable insert for authenticated users" ON comment_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON comment_likes;
CREATE POLICY "Enable delete for authenticated users" ON comment_likes
FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable read for all users" ON comment_likes;
CREATE POLICY "Enable read for all users" ON comment_likes
FOR SELECT USING (true);