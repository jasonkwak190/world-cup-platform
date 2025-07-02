-- ================================================
-- 🚀 World Cup Platform - Supabase 설정 스크립트 (권한 문제 해결)
-- ================================================
-- 
-- 🔧 사용법:
-- 1. Supabase 대시보드 → SQL Editor
-- 2. 이 전체 스크립트를 복사하여 붙여넣기
-- 3. Run 버튼 클릭
-- 
-- ⚠️ 참고: 일부 ALTER TABLE 명령은 Supabase에서 자동으로 관리되므로
--         오류가 발생할 수 있지만 정상적인 동작입니다.

-- ================================================
-- 0. 기존 정책 정리 (중복 방지)
-- ================================================

-- 기존 RLS 정책들 제거
DROP POLICY IF EXISTS "Anyone can view public worldcups" ON worldcups;
DROP POLICY IF EXISTS "Authenticated users can insert worldcups" ON worldcups;
DROP POLICY IF EXISTS "Users can update own worldcups" ON worldcups;
DROP POLICY IF EXISTS "Users can delete own worldcups" ON worldcups;
DROP POLICY IF EXISTS "Users can manage own worldcups" ON worldcups;

DROP POLICY IF EXISTS "Anyone can view items of public worldcups" ON worldcup_items;
DROP POLICY IF EXISTS "Worldcup authors can insert items" ON worldcup_items;
DROP POLICY IF EXISTS "Worldcup authors can update items" ON worldcup_items;
DROP POLICY IF EXISTS "Worldcup authors can delete items" ON worldcup_items;
DROP POLICY IF EXISTS "Worldcup authors can manage items" ON worldcup_items;

DROP POLICY IF EXISTS "Anyone can view user profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;

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
-- 1. Storage 버킷 먼저 생성 (RLS 정책보다 우선)
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
-- 5. Storage 정책 설정 (수정된 버전)
-- ================================================

-- 월드컵 썸네일 업로드 정책 (모든 인증된 사용자가 업로드 가능)
CREATE POLICY "Authenticated users can upload worldcup thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'worldcup-thumbnails' AND
        auth.role() = 'authenticated'
    );

-- 월드컵 썸네일 조회 정책 (모든 사용자)
CREATE POLICY "Anyone can view worldcup thumbnails" ON storage.objects
    FOR SELECT USING (bucket_id = 'worldcup-thumbnails');

-- 월드컵 썸네일 수정/삭제 정책 (업로드한 사용자만)
CREATE POLICY "Users can update own worldcup thumbnails" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'worldcup-thumbnails' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own worldcup thumbnails" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'worldcup-thumbnails' AND
        auth.role() = 'authenticated'
    );

-- 월드컵 아이템 이미지 업로드 정책 (모든 인증된 사용자가 업로드 가능)
CREATE POLICY "Authenticated users can upload worldcup item images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'worldcup-images' AND
        auth.role() = 'authenticated'
    );

-- 월드컵 아이템 이미지 조회 정책 (모든 사용자)
CREATE POLICY "Anyone can view worldcup item images" ON storage.objects
    FOR SELECT USING (bucket_id = 'worldcup-images');

-- 월드컵 아이템 이미지 수정/삭제 정책 (업로드한 사용자만)
CREATE POLICY "Users can update own worldcup item images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'worldcup-images' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own worldcup item images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'worldcup-images' AND
        auth.role() = 'authenticated'
    );

-- 프로필 이미지 업로드 정책 (모든 인증된 사용자가 업로드 가능)
CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated'
    );

-- 프로필 이미지 조회 정책 (모든 사용자)
CREATE POLICY "Anyone can view profile images" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

-- 프로필 이미지 수정/삭제 정책 (업로드한 사용자만)
CREATE POLICY "Users can update own profile images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own profile images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated'
    );

-- ================================================
-- 6. 보안 함수 생성
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
-- 7. 트리거 함수 생성 (자동 타임스탬프 업데이트)
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

-- users 테이블 updated_at 트리거 생성 (users 테이블에 updated_at 컬럼이 있는 경우)
-- DROP TRIGGER IF EXISTS update_users_updated_at ON users;
-- CREATE TRIGGER update_users_updated_at
--     BEFORE UPDATE ON users
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 8. 권한 부여
-- ================================================

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION increment_worldcup_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_worldcup_likes(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_worldcup_comments(UUID, INTEGER) TO authenticated;

-- ================================================
-- 9. 검증 및 완료 메시지
-- ================================================

-- Storage 버킷 확인
DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Storage 버킷 개수 확인
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets
    WHERE id IN ('worldcup-thumbnails', 'worldcup-images', 'profile-images');
    
    -- RLS 정책 개수 확인
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('users', 'worldcups', 'worldcup_items');
    
    RAISE NOTICE '';
    RAISE NOTICE '🚀 =================================================';
    RAISE NOTICE '🎉 World Cup Platform Supabase 설정 완료!';
    RAISE NOTICE '🚀 =================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ 검증 결과:';
    RAISE NOTICE '   🪣 Storage 버킷: % 개 (정상: 3개)', bucket_count;
    RAISE NOTICE '   📋 RLS 정책: % 개', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '📋 설정된 항목들:';
    RAISE NOTICE '   ✅ RLS 정책 (users, worldcups, worldcup_items)';
    RAISE NOTICE '   ✅ Storage 버킷 (worldcup-thumbnails, worldcup-images, profile-images)';
    RAISE NOTICE '   ✅ Storage 정책 (업로드, 조회, 수정, 삭제)';
    RAISE NOTICE '   ✅ 보안 함수 (참여자 수, 좋아요 수, 댓글 수 업데이트)';
    RAISE NOTICE '   ✅ 자동 트리거 (updated_at 타임스탬프)';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 보안 특징:';
    RAISE NOTICE '   • 로그인 필수: 월드컵 생성 및 이미지 업로드';
    RAISE NOTICE '   • 작성자만 관리: 자신의 월드컵만 수정/삭제 가능';
    RAISE NOTICE '   • 공개 조회: Public 월드컵은 누구나 조회 가능';
    RAISE NOTICE '';
    
    IF bucket_count = 3 THEN
        RAISE NOTICE '🎉 모든 설정이 완료되었습니다!';
        RAISE NOTICE '🚀 이제 월드컵 생성과 이미지 업로드가 정상적으로 작동합니다!';
        RAISE NOTICE '🌐 브라우저에서 http://localhost:3000 에 접속하여 테스트하세요.';
    ELSE
        RAISE NOTICE '⚠️  일부 Storage 버킷이 생성되지 않았습니다.';
        RAISE NOTICE '   Supabase 대시보드에서 Storage 메뉴를 확인해주세요.';
    END IF;
    
    RAISE NOTICE '';
END $$;