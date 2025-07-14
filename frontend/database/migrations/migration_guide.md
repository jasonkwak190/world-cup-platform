# Google OAuth Migration Guide 🔐

## 개요

이 가이드는 World Cup Platform을 기존 이메일/비밀번호 인증에서 Google OAuth로 완전 전환하는 마이그레이션 프로세스를 다룹니다.

## 🎯 마이그레이션 목표

- ✅ 기존 사용자 데이터 100% 보존
- ✅ 인증 시스템 단순화 (Google OAuth만 사용)
- ✅ 사용자 경험 개선 (원클릭 로그인)
- ✅ 보안 강화 (Google의 보안 인프라 활용)

## 📋 사전 준비사항

### 1. Google OAuth 설정
```bash
# Supabase 대시보드에서 설정
1. Authentication > Providers > Google
2. Client ID와 Client Secret 설정
3. Redirect URLs 설정: https://your-project.supabase.co/auth/v1/callback
```

### 2. 환경 변수 확인
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚀 마이그레이션 단계

### Phase 1: 준비 단계 (001_add_google_oauth_columns.sql)

**실행 시기**: 즉시 실행 가능 (기존 시스템에 영향 없음)

```sql
-- 데이터베이스에서 실행
\i database/migrations/001_add_google_oauth_columns.sql
```

**변경 사항**:
- `users` 테이블에 Google OAuth 지원 컬럼 추가
- 기존 사용자는 `provider='email'`로 설정
- 마이그레이션 추적을 위한 로그 테이블 생성

**검증 방법**:
```sql
-- 새 컬럼이 추가되었는지 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('supabase_auth_id', 'provider', 'is_migrated');

-- 기존 사용자가 email provider로 설정되었는지 확인
SELECT provider, COUNT(*) FROM users GROUP BY provider;
```

### Phase 2: 헬퍼 함수 설치 (002_google_oauth_helper_functions.sql)

**실행 시기**: Phase 1 완료 후

```sql
\i database/migrations/002_google_oauth_helper_functions.sql
```

**변경 사항**:
- Google OAuth 사용자 처리 함수들 생성
- 기존 사용자 마이그레이션 로직
- 마이그레이션 상태 모니터링 함수

**검증 방법**:
```sql
-- 함수들이 생성되었는지 확인
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%google%' OR routine_name LIKE '%migration%';

-- 마이그레이션 상태 확인
SELECT * FROM check_migration_status();
```

### Phase 3: 애플리케이션 코드 업데이트

**실행 시기**: Phase 2 완료 후

#### 3.1 Google OAuth Provider 추가

`src/utils/supabaseAuth.ts`에 추가:
```typescript
// Google OAuth 로그인
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Google login error:', error);
    return { success: false, error: 'Google 로그인 중 오류가 발생했습니다.' };
  }
}

// OAuth 콜백 처리
export async function handleOAuthCallback() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.session?.user) {
      return { success: false, error: '세션을 찾을 수 없습니다.' };
    }

    // Google OAuth 사용자 처리
    const { data: result } = await supabase.rpc('find_or_create_google_user', {
      auth_user_id: data.session.user.id,
      google_email: data.session.user.email,
      google_name: data.session.user.user_metadata?.full_name || '',
      google_avatar_url: data.session.user.user_metadata?.avatar_url,
      google_provider_id: data.session.user.user_metadata?.provider_id
    });

    return { success: true, user: result[0]?.user_record };
  } catch (error) {
    console.error('OAuth callback error:', error);
    return { success: false, error: 'OAuth 처리 중 오류가 발생했습니다.' };
  }
}
```

#### 3.2 AuthModal 컴포넌트 업데이트

`src/components/AuthModal.tsx` 수정:
```typescript
// Google 로그인 버튼 추가
<button
  onClick={() => signInWithGoogle()}
  className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 transition-colors"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    {/* Google 아이콘 SVG */}
  </svg>
  <span>Google로 계속하기</span>
</button>
```

#### 3.3 OAuth 콜백 페이지 생성

`src/app/auth/callback/page.tsx`:
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleOAuthCallback } from '@/utils/supabaseAuth';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const result = await handleOAuthCallback();
      
      if (result.success) {
        router.push('/');
      } else {
        router.push('/login?error=' + encodeURIComponent(result.error));
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
        <p className="mt-4">로그인 처리 중...</p>
      </div>
    </div>
  );
}
```

### Phase 4: 점진적 마이그레이션 테스트

**실행 시기**: 애플리케이션 코드 업데이트 후

#### 4.1 테스트 사용자로 검증
```sql
-- 테스트 계정으로 Google 로그인 시도
-- 기존 이메일과 동일한 Google 계정으로 로그인하여 자동 연결 확인

-- 마이그레이션 상태 확인
SELECT 
    email,
    provider,
    is_migrated,
    supabase_auth_id IS NOT NULL as has_auth_id
FROM users 
WHERE email = 'test@example.com';
```

#### 4.2 데이터 보존 확인
```sql
-- 사용자의 worldcups과 game_sessions가 유지되는지 확인
SELECT 
    u.email,
    u.is_migrated,
    COUNT(w.id) as worldcup_count,
    COUNT(gs.id) as game_session_count
FROM users u
LEFT JOIN worldcups w ON u.id = w.author_id
LEFT JOIN game_sessions gs ON u.id = gs.player_id
WHERE u.email = 'test@example.com'
GROUP BY u.id, u.email, u.is_migrated;
```

### Phase 5: 완전 전환 (이메일 인증 제거)

**실행 시기**: 모든 사용자가 Google OAuth로 마이그레이션 완료 후

#### 5.1 마이그레이션 완료율 확인
```sql
-- 모든 사용자가 마이그레이션되었는지 확인 (100%여야 함)
SELECT * FROM check_migration_status();
```

#### 5.2 이메일 인증 시스템 제거
```sql
-- 모든 사용자가 마이그레이션된 경우에만 실행
\i database/migrations/003_cleanup_email_auth_system.sql
```

#### 5.3 코드 정리
- `AuthModal.tsx`에서 이메일/비밀번호 입력 폼 제거
- `supabaseAuth.ts`에서 OTP 관련 함수들 제거
- API 라우트 제거: `/api/auth/send-reset-otp`, `/api/auth/reset-password`

## 🔄 롤백 가이드

### 긴급 롤백이 필요한 경우

#### 1. Phase 1-2 롤백 (컬럼만 추가된 상태)
```sql
-- 추가된 컬럼들 제거
ALTER TABLE users 
DROP COLUMN IF EXISTS supabase_auth_id,
DROP COLUMN IF EXISTS provider,
DROP COLUMN IF EXISTS provider_id,
DROP COLUMN IF EXISTS avatar_url,
DROP COLUMN IF EXISTS google_email,
DROP COLUMN IF EXISTS is_migrated;

-- 로그 테이블 제거
DROP TABLE IF EXISTS user_migration_log;

-- 함수들 제거
DROP FUNCTION IF EXISTS find_or_create_google_user;
DROP FUNCTION IF EXISTS link_user_to_google_oauth;
-- ... 기타 추가된 함수들
```

#### 2. Phase 3-4 롤백 (애플리케이션 코드)
- Git에서 이전 커밋으로 되돌리기
- 환경 변수에서 Google OAuth 설정 제거

## 📊 모니터링 및 검증

### 1. 마이그레이션 진행 상황 모니터링
```sql
-- 실시간 마이그레이션 상태
SELECT * FROM check_migration_status();

-- 최근 마이그레이션 로그
SELECT * FROM user_migration_log 
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. 데이터 무결성 검증
```sql
-- 외래 키 제약 조건 확인
SELECT 
    COUNT(*) as total_worldcups,
    COUNT(author_id) as worldcups_with_author,
    COUNT(*) - COUNT(author_id) as orphaned_worldcups
FROM worldcups;

SELECT 
    COUNT(*) as total_sessions,
    COUNT(player_id) as sessions_with_player,
    COUNT(*) - COUNT(player_id) as anonymous_sessions
FROM game_sessions;
```

### 3. 성능 모니터링
```sql
-- 인덱스 사용률 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'users';
```

## 🚨 주의사항

### 1. 백업 필수
- 마이그레이션 실행 전 전체 데이터베이스 백업
- 특히 `users`, `worldcups`, `game_sessions` 테이블

### 2. 점진적 접근
- 한 번에 모든 단계를 실행하지 말고 단계별로 검증
- 각 단계 후 반드시 데이터 무결성 확인

### 3. 사용자 공지
- 마이그레이션 전 사용자들에게 변경 사항 안내
- Google 계정 연결 필요성 설명

### 4. 모니터링
- 마이그레이션 후 며칠간 에러 로그 모니터링
- 사용자 피드백 수집 및 대응

## 📞 문제 해결

### 자주 발생하는 문제들

#### 1. Google OAuth 설정 오류
```
Error: Invalid OAuth configuration
```
**해결**: Supabase 대시보드에서 Google OAuth 설정 재확인

#### 2. 사용자 중복 생성
```
Error: User already exists
```
**해결**: `find_or_create_google_user` 함수가 올바르게 작동하는지 확인

#### 3. 데이터 연결 끊어짐
```
Error: Foreign key violation
```
**해결**: `preserve_user_relationships` 함수 실행

## ✅ 마이그레이션 체크리스트

### 사전 준비
- [ ] 데이터베이스 백업 완료
- [ ] Google OAuth 설정 완료
- [ ] 환경 변수 설정 확인
- [ ] 개발 환경에서 테스트 완료

### Phase 1: 데이터베이스 준비
- [ ] 001_add_google_oauth_columns.sql 실행
- [ ] 새 컬럼 추가 확인
- [ ] 기존 사용자 provider='email' 설정 확인

### Phase 2: 헬퍼 함수
- [ ] 002_google_oauth_helper_functions.sql 실행
- [ ] 함수 생성 확인
- [ ] check_migration_status() 실행 테스트

### Phase 3: 애플리케이션 코드
- [ ] Google OAuth 로그인 함수 추가
- [ ] AuthModal 컴포넌트 업데이트
- [ ] OAuth 콜백 페이지 생성
- [ ] 테스트 계정으로 로그인 검증

### Phase 4: 점진적 마이그레이션
- [ ] 기존 사용자 Google 로그인 테스트
- [ ] 자동 계정 연결 확인
- [ ] 데이터 보존 검증
- [ ] 마이그레이션 완료율 100% 확인

### Phase 5: 정리
- [ ] 003_cleanup_email_auth_system.sql 실행
- [ ] 이메일 인증 코드 제거
- [ ] API 라우트 제거
- [ ] 최종 검증 완료

---

## 📧 지원

마이그레이션 과정에서 문제가 발생하면:
1. 먼저 이 가이드의 문제 해결 섹션 확인
2. 데이터베이스 로그 확인
3. 필요시 롤백 가이드 따라 이전 상태로 복구

**중요**: 프로덕션 환경에서는 반드시 개발 환경에서 전체 프로세스를 테스트한 후 진행하세요.