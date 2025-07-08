# Database Documentation

이 디렉토리는 Supabase 데이터베이스 스키마와 RLS 정책을 관리합니다.

## 파일 구조

```
database/
├── current-schema.sql     # 🎯 실제 Supabase 스키마 (실제 DB에서 가져온 것)
├── current-rls-policies.sql # 🔐 실제 RLS 정책들 (실제 DB에서 가져온 것)
├── export-policies.sql    # 📤 Supabase에서 스키마/정책 가져오는 쿼리들
├── example-schema.sql     # 📋 예시 스키마 (참고용)
├── example-rls-policies.sql # 📋 예시 RLS 정책 (참고용)
└── schemas/              # 📁 보관용 (필요시 참조)
```

## 주요 파일

### `current-schema.sql` ⭐ **실제 사용**
- 실제 Supabase에서 가져온 테이블 정의
- 현재 운영 중인 데이터베이스 구조
- **이 파일을 업데이트해야 함**

### `current-rls-policies.sql` ⭐ **실제 사용**
- 실제 Supabase에서 가져온 RLS 정책들
- 현재 운영 중인 보안 정책
- **이 파일을 업데이트해야 함**

### `export-policies.sql` 🔧 **도구**
- Supabase SQL Editor에서 실행할 쿼리들
- 현재 스키마와 RLS 정책을 확인하고 내보내기
- 스키마/정책 상태 검증

### 예시 파일들 📚 **참고용**
- `example-schema.sql`: 예시 스키마 구조
- `example-rls-policies.sql`: 예시 RLS 정책

## 🔄 실제 스키마/정책 가져오는 방법

### 1단계: Supabase에서 현재 스키마 가져오기
1. Supabase Dashboard → SQL Editor 열기
2. `export-policies.sql` 파일의 **PART 1** 쿼리들을 하나씩 실행
3. 결과를 바탕으로 `current-schema.sql` 파일 업데이트

### 2단계: Supabase에서 현재 RLS 정책 가져오기
1. `export-policies.sql` 파일의 **PART 2** 쿼리들을 실행
2. 결과를 바탕으로 `current-rls-policies.sql` 파일 업데이트

### 3단계: 검증
1. `export-policies.sql` 파일의 **PART 3** 쿼리로 함수/트리거 확인

## 사용법

1. **새 환경 설정**: `current-schema.sql` → `current-rls-policies.sql` 순으로 실행
2. **스키마 확인**: `export-policies.sql`의 쿼리로 현재 상태 검증
3. **스키마 변경**: `current-schema.sql` 파일을 직접 수정 후 Supabase에 적용

## ⚠️ 중요한 점

**현재 `current-schema.sql`과 `current-rls-policies.sql` 파일은 비어있습니다.**

실제 사용하려면 위의 방법으로 Supabase에서 데이터를 가져와서 업데이트해야 합니다.

## 데이터베이스 구조

### 핵심 테이블 (8개)
1. **users** - 사용자 정보
2. **worldcups** - 월드컵 정보  
3. **worldcup_items** - 월드컵 아이템 (비디오 지원)
4. **game_sessions** - 게임 세션
5. **game_matches** - 게임 매치 상세
6. **game_results** - 게임 결과 요약
7. **comments** - 댓글 시스템
8. **global_rankings** - 전역 랭킹 시스템

### 주요 기능
- YouTube 비디오 지원 (시작/종료 시간 설정)
- Row Level Security로 보안 강화
- 실시간 랭킹 시스템
- 게스트 사용자 지원
- CASCADE 삭제로 데이터 일관성 보장