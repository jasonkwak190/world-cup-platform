-- 월드컵 플랫폼 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  profile_image_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 월드컵 테이블
CREATE TABLE IF NOT EXISTS worldcups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'entertainment',
  thumbnail_url TEXT,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  participants INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 월드컵 아이템 테이블
CREATE TABLE IF NOT EXISTS worldcup_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worldcup_id UUID REFERENCES worldcups(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 좋아요 테이블
CREATE TABLE IF NOT EXISTS worldcup_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  worldcup_id UUID REFERENCES worldcups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, worldcup_id)
);

-- 5. 북마크 테이블
CREATE TABLE IF NOT EXISTS worldcup_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  worldcup_id UUID REFERENCES worldcups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, worldcup_id)
);

-- 6. 게임 결과 테이블
CREATE TABLE IF NOT EXISTS game_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worldcup_id UUID REFERENCES worldcups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  winner_item_id UUID REFERENCES worldcup_items(id) ON DELETE CASCADE,
  runner_up_item_id UUID REFERENCES worldcup_items(id) ON DELETE CASCADE,
  rounds_played INTEGER NOT NULL,
  play_time_seconds INTEGER,
  user_ip INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 댓글 테이블
CREATE TABLE IF NOT EXISTS worldcup_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worldcup_id UUID REFERENCES worldcups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES worldcup_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_worldcups_author ON worldcups(author_id);
CREATE INDEX IF NOT EXISTS idx_worldcups_category ON worldcups(category);
CREATE INDEX IF NOT EXISTS idx_worldcups_created_at ON worldcups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_worldcup_items_worldcup ON worldcup_items(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_likes_user ON worldcup_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_worldcup_likes_worldcup ON worldcup_likes(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_game_results_worldcup ON game_results(worldcup_id);
CREATE INDEX IF NOT EXISTS idx_comments_worldcup ON worldcup_comments(worldcup_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcups ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcup_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcup_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcup_comments ENABLE ROW LEVEL SECURITY;

-- 사용자 정책: 본인 데이터만 수정 가능
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- 월드컵 정책: 공개 월드컵은 모두 조회, 본인 것만 수정 가능
CREATE POLICY "Anyone can view public worldcups" ON worldcups FOR SELECT USING (is_public = true);
CREATE POLICY "Authors can view their own worldcups" ON worldcups FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Authors can insert worldcups" ON worldcups FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their own worldcups" ON worldcups FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their own worldcups" ON worldcups FOR DELETE USING (auth.uid() = author_id);

-- 월드컵 아이템 정책
CREATE POLICY "Anyone can view items of public worldcups" ON worldcup_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM worldcups WHERE worldcups.id = worldcup_items.worldcup_id AND worldcups.is_public = true)
);
CREATE POLICY "Authors can manage their worldcup items" ON worldcup_items FOR ALL USING (
  EXISTS (SELECT 1 FROM worldcups WHERE worldcups.id = worldcup_items.worldcup_id AND worldcups.author_id = auth.uid())
);

-- 좋아요 정책
CREATE POLICY "Anyone can view likes" ON worldcup_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON worldcup_likes FOR ALL USING (auth.uid() = user_id);

-- 북마크 정책
CREATE POLICY "Users can manage their own bookmarks" ON worldcup_bookmarks FOR ALL USING (auth.uid() = user_id);

-- 게임 결과 정책
CREATE POLICY "Anyone can insert game results" ON game_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view game results" ON game_results FOR SELECT USING (true);

-- 댓글 정책
CREATE POLICY "Anyone can view comments" ON worldcup_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON worldcup_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON worldcup_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON worldcup_comments FOR DELETE USING (auth.uid() = user_id);

-- 스토리지 버킷 생성 (Supabase 대시보드에서 수동으로 생성하거나 다음 명령어 사용)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('worldcup-images', 'worldcup-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('worldcup-thumbnails', 'worldcup-thumbnails', true);

-- 스토리지 정책
-- CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT USING (bucket_id IN ('profile-images', 'worldcup-images', 'worldcup-thumbnails'));
-- CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_worldcups_updated_at BEFORE UPDATE ON worldcups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON worldcup_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();