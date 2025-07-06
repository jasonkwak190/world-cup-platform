# 📁 Database 폴더 정리

## 🗂️ 현재 상태 (2025-01-05)

### ✅ 최신 파일들
- `schemas/clean-schema-2025.sql` - 정리된 최신 스키마 (8개 핵심 테이블)
- `schemas/current-schema-0703.sql` - 기존 스키마 (참고용)

### 📋 마이그레이션 파일들
- `../database-migrations/001_add_item_statistics.sql` - 아이템 통계 필드 추가
- `../database-migrations/002_cleanup_unused_tables.sql` - 불필요한 테이블 제거

### 🗑️ 정리 대상 파일들 (삭제 예정)
다음 파일들은 테스트 및 디버깅용으로 생성되었으며, 더 이상 필요하지 않습니다:

**RLS 디버깅 파일들:**
- `debug-comments-rls.sql`
- `debug-rls-policies.sql`
- `debug-user-interactions.sql`
- `enable-rls-and-debug.sql`
- `fix-comments-rls-anon-read.sql`
- `fix-comments-rls-simple.sql`
- `fix-realtime-rls.sql`
- `fix-rls-policies.sql`
- `fix-select-policy.sql`
- `force-fix-rls-corrected.sql`
- `force-fix-rls.sql`
- `restore-comments-rls-safe.sql`
- `temporary-disable-comments-rls.sql`
- `temporary-disable-rls-again.sql`
- `temporary-disable-rls.sql`

**기타 테스트 파일들:**
- `check-tables.sql`
- `cleanup-old-tables.sql`
- `complete-migration-guide-fixed.sql`
- `create-ranking-views.sql`
- `create-user-interactions-only.sql`
- `data-migration-only-fixed.sql`
- `disable-search-trigger.sql`
- `fix-search-function.sql`
- `improved-database-schema.sql`

## 🎯 권장 사용법

### 새 프로젝트 시작시:
```sql
-- 1. 최신 정리된 스키마 사용
\i database/schemas/clean-schema-2025.sql
```

### 기존 프로젝트 정리시:
```sql
-- 1. 불필요한 테이블 제거
\i database-migrations/002_cleanup_unused_tables.sql

-- 2. 아이템 통계 기능 추가 (이미 적용됨)
\i database-migrations/001_add_item_statistics.sql
```

## 📊 최종 데이터베이스 구조

### 핵심 테이블 (8개)
1. `users` - 사용자 정보
2. `worldcups` - 월드컵 정보  
3. `worldcup_items` - 월드컵 아이템 (통계 포함)
4. `comments` - 댓글 시스템
5. `user_interactions` - 사용자 상호작용 통합
6. `game_sessions` - 게임 세션
7. `game_matches` - 게임 매치 상세
8. `game_results` - 게임 결과 요약

### 제거된 테이블 (15개)
- 백업 테이블 7개
- 중복 기능 테이블 6개
- 미구현 기능 테이블 2개

## 🧹 정리 작업 필요
위에 나열된 불필요한 SQL 파일들을 삭제하여 폴더를 정리하는 것을 권장합니다.