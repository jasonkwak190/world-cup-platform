-- ================================================
-- 🚀 World Cup Platform - Supabase 완전 설정 스크립트
-- ================================================
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요
-- 
-- 📋 설정 내용:
-- 1. 기존 정책 제거 (중복 방지)
-- 2. RLS 정책 설정 (테이블별 권한 관리)
-- 3. Storage 버킷 생성 및 정책 설정
-- 4. 보안 함수 및 트리거 생성
-- 5. 초기 데이터 설정

-- ================================================
-- 0. 기존 정책 정리 (중복 방지)
-- ================================================

-- 기존 RLS 정책들 제거
DROP POLICY IF EXISTS "Anyone can view public worldcups" ON worldcups;
DROP POLICY IF EXISTS "Authenticated users can insert worldcups" ON worldcups;
DROP POLICY IF EXISTS "Users can update own worldcups" ON worldcups;
DROP POLICY IF EXISTS "Users can delete own worldcups" ON worldcups;

DROP POLICY IF EXISTS "Anyone can view items of public worldcups" ON worldcup_items;
DROP POLICY IF EXISTS "Worldcup authors can insert items" ON worldcup_items;
DROP POLICY IF EXISTS "Worldcup authors can update items" ON worldcup_items;
DROP POLICY IF EXISTS "Worldcup authors can delete items" ON worldcup_items;

DROP POLICY IF EXISTS "Anyone can view user profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 기존 Storage 정책들 제거
DROP POLICY IF EXISTS "Authenticated users can upload worldcup thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view worldcup thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own worldcup thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own worldcup thumbnails" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload worldcup item images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view worldcup item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own worldcup item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own worldcup item images" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;

-- ================================================
-- 1. RLS 활성화 확인
-- ================================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcups ENABLE ROW LEVEL SECURITY;
ALTER TABLE worldcup_items ENABLE ROW LEVEL SECURITY;

-- Storage 객체에 RLS 활성화
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. RLS 정책 설정 (worldcups 테이블)
-- ================================================

-- worldcups 테이블 SELECT 정책 (모든 public 월드컵은 누구나 조회 가능)
CREATE POLICY "Anyone can view public worldcups" ON worldcups
    FOR SELECT USING (is_public = true);

-- worldcups 테이블 작성자 전체 액세스 정책 (작성자는 자신의 월드컵을 모든 작업 가능)
CREATE POLICY "Users can manage own worldcups" ON worldcups
    FOR ALL USING (auth.uid() = author_id);

-- worldcups 테이블 INSERT 정책 (로그인한 사용자만 생성 가능, author_id 자동 설정)
CREATE POLICY "Authenticated users can insert worldcups" ON worldcups
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        auth.uid() = author_id
    );

-- ================================================
-- 3. RLS 정책 설정 (worldcup_items 테이블)
-- ================================================

-- worldcup_items 테이블 SELECT 정책 (public 월드컵의 아이템은 누구나 조회 가능)
CREATE POLICY "Anyone can view items of public worldcups" ON worldcup_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.is_public = true
        )
    );

-- worldcup_items 테이블 작성자 관리 정책 (월드컵 작성자는 아이템 전체 관리 가능)
CREATE POLICY "Worldcup authors can manage items" ON worldcup_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.author_id = auth.uid()
        )
    );

-- worldcup_items 테이블 INSERT 정책 (월드컵 작성자만 아이템 추가 가능)
CREATE POLICY "Worldcup authors can insert items" ON worldcup_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM worldcups 
            WHERE worldcups.id = worldcup_items.worldcup_id 
            AND worldcups.author_id = auth.uid()
        )
    );

-- ================================================
-- 4. RLS 정책 설정 (users 테이블)
-- ================================================

-- users 테이블 SELECT 정책 (모든 사용자 프로필은 공개)
CREATE POLICY "Anyone can view user profiles" ON users
    FOR SELECT USING (true);

-- users 테이블 INSERT 정책 (자신의 프로필만 생성 가능)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- users 테이블 UPDATE 정책 (자신의 프로필만 수정 가능)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- users 테이블 DELETE 정책 (자신의 프로필만 삭제 가능)
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- ================================================
-- 5. Storage 버킷 생성
-- ================================================

-- 월드컵 썸네일 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'worldcup-thumbnails',
    'worldcup-thumbnails',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 월드컵 아이템 이미지 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'worldcup-images',
    'worldcup-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 프로필 이미지 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-images',
    'profile-images',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 6. Storage 정책 설정
-- ================================================

-- 월드컵 썸네일 업로드 정책 (로그인한 사용자만, 자신의 폴더에만)
CREATE POLICY "Authenticated users can upload worldcup thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'worldcup-thumbnails' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 월드컵 썸네일 조회 정책 (모든 사용자)
CREATE POLICY "Anyone can view worldcup thumbnails" ON storage.objects
    FOR SELECT USING (bucket_id = 'worldcup-thumbnails');

-- 월드컵 썸네일 수정/삭제 정책 (파일 소유자만)
CREATE POLICY "Users can update own worldcup thumbnails" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'worldcup-thumbnails' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own worldcup thumbnails" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'worldcup-thumbnails' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 월드컵 아이템 이미지 업로드 정책 (로그인한 사용자만, 자신의 폴더에만)
CREATE POLICY "Authenticated users can upload worldcup item images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'worldcup-images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 월드컵 아이템 이미지 조회 정책 (모든 사용자)
CREATE POLICY "Anyone can view worldcup item images" ON storage.objects
    FOR SELECT USING (bucket_id = 'worldcup-images');

-- 월드컵 아이템 이미지 수정/삭제 정책 (파일 소유자만)
CREATE POLICY "Users can update own worldcup item images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'worldcup-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own worldcup item images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'worldcup-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 프로필 이미지 업로드 정책 (로그인한 사용자만, 자신의 폴더에만)
CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 프로필 이미지 조회 정책 (모든 사용자)
CREATE POLICY "Anyone can view profile images" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

-- 프로필 이미지 수정/삭제 정책 (파일 소유자만)
CREATE POLICY "Users can update own profile images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own profile images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ================================================
-- 7. 보안 함수 생성
-- ================================================

-- 월드컵 참여자 수 증가 함수 (안전한 업데이트)
CREATE OR REPLACE FUNCTION increment_worldcup_participants(worldcup_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE worldcups 
    SET participants = participants + 1,
        updated_at = NOW()
    WHERE id = worldcup_id AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 월드컵 좋아요 수 업데이트 함수 (안전한 업데이트)
CREATE OR REPLACE FUNCTION update_worldcup_likes(worldcup_id UUID, new_likes INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE worldcups 
    SET likes = GREATEST(0, new_likes),  -- 음수 방지
        updated_at = NOW()
    WHERE id = worldcup_id AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 월드컵 댓글 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_worldcup_comments(worldcup_id UUID, new_comments INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE worldcups 
    SET comments = GREATEST(0, new_comments),  -- 음수 방지
        updated_at = NOW()
    WHERE id = worldcup_id AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 8. 트리거 함수 생성 (자동 타임스탬프 업데이트)
-- ================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- worldcups 테이블 updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_worldcups_updated_at ON worldcups;
CREATE TRIGGER update_worldcups_updated_at
    BEFORE UPDATE ON worldcups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- users 테이블 updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 9. 권한 부여 (필요한 경우)
-- ================================================

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION increment_worldcup_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_worldcup_likes(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_worldcup_comments(UUID, INTEGER) TO authenticated;

-- ================================================
-- 10. 초기 테스트 데이터 (선택사항)
-- ================================================

-- 테스트용 공개 월드컵 생성 (실제 사용시 제거 가능)
-- INSERT INTO worldcups (
--     id,
--     title,
--     description,
--     category,
--     author_id,
--     is_public,
--     participants,
--     likes,
--     comments
-- ) VALUES (
--     gen_random_uuid(),
--     '테스트 월드컵',
--     '시스템 테스트용 월드컵입니다.',
--     'test',
--     '00000000-0000-0000-0000-000000000000',
--     true,
--     0,
--     0,
--     0
-- ) ON CONFLICT DO NOTHING;

-- ================================================
-- 11. 검증 쿼리
-- ================================================

-- RLS 정책 확인
DO $$
DECLARE
    policy_count INTEGER;
    bucket_count INTEGER;
BEGIN
    -- RLS 정책 개수 확인
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('users', 'worldcups', 'worldcup_items');
    
    -- Storage 버킷 개수 확인
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets
    WHERE id IN ('worldcup-thumbnails', 'worldcup-images', 'profile-images');
    
    RAISE NOTICE '✅ 검증 결과:';
    RAISE NOTICE '   📋 RLS 정책: % 개', policy_count;
    RAISE NOTICE '   🪣 Storage 버킷: % 개', bucket_count;
    
    IF policy_count >= 8 AND bucket_count = 3 THEN
        RAISE NOTICE '🎉 모든 설정이 완료되었습니다!';
    ELSE
        RAISE NOTICE '⚠️  일부 설정이 누락되었을 수 있습니다.';
    END IF;
END $$;

-- ================================================
-- 12. 완료 메시지
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 =================================================';
    RAISE NOTICE '🎉 World Cup Platform Supabase 설정 완료!';
    RAISE NOTICE '🚀 =================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 설정된 항목들:';
    RAISE NOTICE '   ✅ RLS 정책 (users, worldcups, worldcup_items)';
    RAISE NOTICE '   ✅ Storage 버킷 (worldcup-thumbnails, worldcup-images, profile-images)';
    RAISE NOTICE '   ✅ Storage 정책 (업로드, 조회, 수정, 삭제)';
    RAISE NOTICE '   ✅ 보안 함수 (참여자 수, 좋아요 수, 댓글 수 업데이트)';
    RAISE NOTICE '   ✅ 자동 트리거 (updated_at 타임스탬프)';
    RAISE NOTICE '   ✅ 권한 관리 및 보안 설정';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 보안 특징:';
    RAISE NOTICE '   • 로그인 필수: 월드컵 생성 및 이미지 업로드';
    RAISE NOTICE '   • 작성자만 관리: 자신의 월드컵만 수정/삭제 가능';
    RAISE NOTICE '   • 폴더 격리: 사용자별 Storage 폴더 분리';
    RAISE NOTICE '   • 공개 조회: Public 월드컵은 누구나 조회 가능';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 이제 월드컵 생성과 이미지 업로드가 정상적으로 작동합니다!';
    RAISE NOTICE '🌐 브라우저에서 http://localhost:3000 에 접속하여 테스트하세요.';
    RAISE NOTICE '';
END $$;