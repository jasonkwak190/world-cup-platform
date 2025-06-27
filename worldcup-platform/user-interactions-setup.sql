-- 사용자 북마크 테이블
CREATE TABLE user_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  worldcup_id UUID REFERENCES worldcups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, worldcup_id)
);

-- 사용자 좋아요 테이블
CREATE TABLE user_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  worldcup_id UUID REFERENCES worldcups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, worldcup_id)
);

-- RLS 정책 설정
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;

-- 북마크 정책: 본인 데이터만 CRUD 가능
CREATE POLICY "Users can manage their own bookmarks" ON user_bookmarks
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 좋아요 정책: 본인 데이터만 CRUD 가능, 읽기는 모든 사용자 가능 (통계용)
CREATE POLICY "Users can manage their own likes" ON user_likes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes count" ON user_likes
  FOR SELECT USING (true);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX idx_user_bookmarks_worldcup_id ON user_bookmarks(worldcup_id);
CREATE INDEX idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX idx_user_likes_worldcup_id ON user_likes(worldcup_id);