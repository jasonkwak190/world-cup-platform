# Rollback Scripts for Google OAuth Migration

이 디렉토리는 Google OAuth 마이그레이션을 되돌리기 위한 스크립트들을 포함합니다.

## ⚠️ 중요 경고

- **롤백은 신중하게 결정하세요**: 일단 사용자들이 Google OAuth로 로그인하기 시작하면 롤백이 매우 복잡해집니다.
- **데이터 손실 가능성**: 롤백 과정에서 마이그레이션 데이터가 손실될 수 있습니다.
- **백업 필수**: 롤백 실행 전 반드시 전체 데이터베이스를 백업하세요.

## 📁 파일 설명

### rollback_001.sql
- **목적**: 001_add_google_oauth_columns.sql 롤백
- **제거 대상**: 
  - Google OAuth 관련 컬럼들
  - 마이그레이션 로그 테이블
  - 관련 인덱스 및 제약조건

### rollback_002.sql
- **목적**: 002_google_oauth_helper_functions.sql 롤백
- **제거 대상**:
  - 모든 Google OAuth 헬퍼 함수들
  - 마이그레이션 상태 확인 함수들
  - 관련 뷰들

### rollback_003.sql
- **목적**: 003_cleanup_email_auth_system.sql 롤백
- **복원 대상**:
  - password_reset_otps 테이블
  - 이메일 인증 관련 설정들
  - 필수 인덱스들

## 🔄 롤백 순서

롤백은 **역순**으로 실행해야 합니다:

```sql
-- 1. Phase 3 롤백 (가장 최근 변경사항부터)
\i database/migrations/rollback/rollback_003.sql

-- 2. Phase 2 롤백
\i database/migrations/rollback/rollback_002.sql

-- 3. Phase 1 롤백 (가장 기본적인 변경사항)
\i database/migrations/rollback/rollback_001.sql
```

## 🧪 롤백 전 확인사항

### 1. 현재 마이그레이션 상태 확인
```sql
-- 마이그레이션된 사용자 수 확인
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE is_migrated = true) as migrated_users,
    COUNT(*) FILTER (WHERE provider = 'google') as google_users
FROM users;
```

### 2. Google OAuth 사용자 존재 여부 확인
```sql
-- Google으로 로그인한 사용자가 있는지 확인
SELECT COUNT(*) as google_login_count 
FROM users 
WHERE provider = 'google' AND supabase_auth_id IS NOT NULL;
```

### 3. 마이그레이션 로그 확인
```sql
-- 최근 마이그레이션 활동 확인
SELECT migration_status, COUNT(*) 
FROM user_migration_log 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY migration_status;
```

## ⚡ 부분 롤백 시나리오

### 시나리오 1: Phase 1만 롤백 (컬럼만 제거)
- **상황**: 아직 아무도 Google OAuth를 사용하지 않음
- **실행**: `rollback_001.sql`만 실행
- **안전도**: 높음

### 시나리오 2: Phase 1-2 롤백 (함수까지 제거)
- **상황**: Google OAuth 기능을 구현했지만 아직 프로덕션에 배포하지 않음
- **실행**: `rollback_002.sql` → `rollback_001.sql`
- **안전도**: 높음

### 시나리오 3: 전체 롤백
- **상황**: 이미 사용자들이 Google OAuth를 사용하기 시작함
- **실행**: `rollback_003.sql` → `rollback_002.sql` → `rollback_001.sql`
- **안전도**: 낮음 (데이터 손실 위험)

## 🚨 롤백 후 필수 작업

### 1. 애플리케이션 코드 복원
```bash
# Git에서 이전 커밋으로 되돌리기
git checkout <pre-migration-commit>

# 또는 관련 파일들만 개별 복원
git checkout HEAD~n -- src/utils/supabaseAuth.ts
git checkout HEAD~n -- src/components/AuthModal.tsx
git checkout HEAD~n -- src/app/api/auth/
```

### 2. 환경 변수 정리
```env
# Google OAuth 관련 환경 변수 제거 (필요시)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

### 3. Supabase 설정 복원
- Authentication > Providers에서 Google OAuth 비활성화
- RLS 정책 검토 및 복원

## 🔍 롤백 검증

### 1. 데이터베이스 구조 확인
```sql
-- 제거된 컬럼들이 없는지 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('supabase_auth_id', 'provider', 'is_migrated');
-- 결과가 없어야 함

-- 제거된 함수들이 없는지 확인  
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%google%' OR routine_name LIKE '%migration%';
-- 결과가 없어야 함
```

### 2. 기능 테스트
- 이메일/비밀번호 로그인 테스트
- 비밀번호 재설정 기능 테스트
- 기존 사용자 데이터 무결성 확인

### 3. 외래 키 제약조건 확인
```sql
-- worldcups과 game_sessions의 외래 키가 여전히 유효한지 확인
SELECT 
    COUNT(*) as total_worldcups,
    COUNT(w.author_id) as worldcups_with_valid_author
FROM worldcups w
LEFT JOIN users u ON w.author_id = u.id;

SELECT 
    COUNT(*) as total_sessions,
    COUNT(gs.player_id) as sessions_with_valid_player  
FROM game_sessions gs
LEFT JOIN users u ON gs.player_id = u.id
WHERE gs.player_id IS NOT NULL;
```

## 📞 롤백 실패 시 대응

### 1. 백업에서 복원
```sql
-- 전체 데이터베이스 복원
pg_restore -d your_database backup_file.dump
```

### 2. 부분 복원
```sql
-- 특정 테이블만 복원
pg_restore -t users -d your_database backup_file.dump
```

### 3. 수동 데이터 복구
- 마이그레이션 로그를 활용한 데이터 재구성
- archived_* 테이블에서 데이터 복원

## 📋 롤백 체크리스트

### 롤백 전
- [ ] 전체 데이터베이스 백업 완료
- [ ] 현재 마이그레이션 상태 문서화
- [ ] Google OAuth 사용자 수 확인
- [ ] 롤백 이유 및 범위 명확화

### 롤백 실행
- [ ] 애플리케이션 점검 모드 활성화
- [ ] 롤백 스크립트 순차 실행
- [ ] 각 단계별 검증 완료
- [ ] 에러 로그 모니터링

### 롤백 후
- [ ] 데이터베이스 구조 검증
- [ ] 애플리케이션 기능 테스트
- [ ] 사용자 데이터 무결성 확인
- [ ] 성능 모니터링
- [ ] 사용자 공지사항 발송

---

**⚠️ 마지막 경고**: 롤백은 되돌리기 어려운 작업입니다. 가능하면 롤백보다는 문제를 수정하는 방향으로 접근하는 것이 좋습니다.