# 🗄️ World Cup Platform Database Schema

## 📋 개요
이상형 월드컵 플랫폼의 최종 데이터베이스 스키마 및 마이그레이션 가이드입니다.

## 📁 파일 구조

### 핵심 스키마 파일
- `complete-migration-guide-fixed.sql` - 전체 데이터베이스 스키마 생성 및 설정
- `data-migration-only-fixed.sql` - 기존 데이터 마이그레이션 스크립트
- `create-ranking-views.sql` - 랭킹 및 통계 뷰 생성

### 유틸리티 파일
- `fix-search-function.sql` - 검색 벡터 함수 수정
- `disable-search-trigger.sql` - 검색 트리거 비활성화 (임시)

## 🏗️ 최종 테이블 구조

### 1. 핵심 엔티티 테이블

#### `users` (사용자)
```sql
- id: UUID (PK)
- username: VARCHAR(50) UNIQUE
- email: VARCHAR(255) UNIQUE
- profile_image_url: TEXT
- display_name: VARCHAR(100)
- bio: TEXT
- cover_image_url: TEXT
- is_verified: BOOLEAN
- is_active: BOOLEAN
- role: VARCHAR(20) ('user', 'admin', 'moderator')
- followers_count: INTEGER
- following_count: INTEGER
- worldcups_count: INTEGER
- last_login_at: TIMESTAMP WITH TIME ZONE
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

#### `categories` (카테고리)
```sql
- id: SERIAL (PK)
- name: VARCHAR(50) UNIQUE
- slug: VARCHAR(50) UNIQUE
- description: TEXT
- icon_name: VARCHAR(50)
- color_hex: VARCHAR(7)
- display_order: INTEGER
- is_active: BOOLEAN
- worldcups_count: INTEGER
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

#### `worldcups` (월드컵)
```sql
- id: UUID (PK)
- title: VARCHAR(255)
- description: TEXT
- thumbnail_url: TEXT
- author_id: UUID (FK → users.id)
- category_id: INTEGER (FK → categories.id)
- slug: VARCHAR(255) UNIQUE
- status: VARCHAR(20) ('draft', 'published', 'archived', 'banned')
- visibility: VARCHAR(20) ('public', 'private', 'unlisted')
- allow_anonymous_play: BOOLEAN
- participants: INTEGER
- likes: INTEGER
- comments: INTEGER
- bookmark_count: INTEGER
- tags: TEXT[]
- search_vector: TSVECTOR
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

#### `worldcup_items` (월드컵 아이템)
```sql
- id: UUID (PK)
- worldcup_id: UUID (FK → worldcups.id)
- title: VARCHAR(255)
- image_url: TEXT
- order_index: INTEGER
- seed: INTEGER
- win_count: INTEGER
- loss_count: INTEGER
- win_rate: DECIMAL(5,4)
- video_url: TEXT
- video_start_time: INTEGER
- video_end_time: INTEGER
- source_url: TEXT
- attribution: TEXT
- created_at: TIMESTAMP WITH TIME ZONE
```

### 2. 통합 상호작용 시스템

#### `user_interactions` (사용자 상호작용)
```sql
- id: UUID (PK)
- user_id: UUID (FK → users.id)
- target_type: VARCHAR(20) ('worldcup', 'comment', 'user')
- target_id: UUID
- interaction_type: VARCHAR(20) ('like', 'bookmark', 'follow', 'report', 'block')
- metadata: JSONB
- created_at: TIMESTAMP WITH TIME ZONE
- UNIQUE(user_id, target_type, target_id, interaction_type)
```

**특징:**
- 좋아요, 북마크, 팔로우 등 모든 상호작용을 하나의 테이블로 통합
- 유연한 메타데이터 저장 (JSONB)
- 중복 방지를 위한 복합 UNIQUE 제약조건

### 3. 댓글 시스템

#### `comments` (댓글)
```sql
- id: UUID (PK)
- worldcup_id: UUID (FK → worldcups.id)
- author_id: UUID (FK → users.id, NULL 허용)
- parent_id: UUID (FK → comments.id, 대댓글용)
- content: TEXT
- guest_name: VARCHAR(50) (비회원용)
- guest_session_id: VARCHAR(255) (비회원용)
- is_edited: BOOLEAN
- is_pinned: BOOLEAN
- is_deleted: BOOLEAN
- like_count: INTEGER
- reply_count: INTEGER
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

**특징:**
- 회원/비회원 댓글 통합 지원
- 계층형 댓글 구조 (parent_id)
- 소프트 삭제 (is_deleted)

### 4. 게임 시스템

#### `game_sessions` (게임 세션)
```sql
- id: UUID (PK)
- worldcup_id: UUID (FK → worldcups.id)
- player_id: UUID (FK → users.id, NULL 허용)
- session_token: VARCHAR(255) UNIQUE
- tournament_bracket: JSONB
- current_round: INTEGER
- status: VARCHAR(20) ('in_progress', 'completed', 'abandoned')
- winner_item_id: UUID (FK → worldcup_items.id)
- runner_up_item_id: UUID (FK → worldcup_items.id)
- total_rounds: INTEGER
- total_matches: INTEGER
- play_time_seconds: INTEGER
- player_ip: INET
- user_agent: TEXT
- created_at: TIMESTAMP WITH TIME ZONE
- completed_at: TIMESTAMP WITH TIME ZONE
```

#### `game_matches` (게임 매치)
```sql
- id: UUID (PK)
- session_id: UUID (FK → game_sessions.id)
- worldcup_id: UUID (FK → worldcups.id)
- round_number: INTEGER
- match_number: INTEGER
- item1_id: UUID (FK → worldcup_items.id)
- item2_id: UUID (FK → worldcup_items.id)
- winner_id: UUID (FK → worldcup_items.id)
- decision_time_ms: INTEGER
- created_at: TIMESTAMP WITH TIME ZONE
```

**특징:**
- 상세한 게임 플레이 추적
- 각 대결의 세부 기록
- 결정 시간 측정

### 5. 알림 시스템

#### `notifications` (알림)
```sql
- id: UUID (PK)
- recipient_id: UUID (FK → users.id)
- actor_id: UUID (FK → users.id, NULL 허용)
- type: VARCHAR(30)
- title: VARCHAR(255)
- message: TEXT
- target_type: VARCHAR(20)
- target_id: UUID
- is_read: BOOLEAN
- is_deleted: BOOLEAN
- metadata: JSONB
- created_at: TIMESTAMP WITH TIME ZONE
- read_at: TIMESTAMP WITH TIME ZONE
```

## 📊 통계 뷰

### `worldcup_item_stats` (아이템 통계)
실시간 승률, 매치 수 등 아이템별 상세 통계

### `worldcup_rankings` (월드컵별 랭킹)
각 월드컵 내 아이템들의 순위

### `global_item_rankings` (전체 아이템 랭킹)
모든 월드컵을 통틀어 인기 아이템 순위

### `worldcup_stats` (월드컵 통계)
월드컵별 플레이 수, 완주율 등 통계

### `user_activity_stats` (사용자 활동 통계)
사용자별 생성 월드컵, 플레이 기록 등

### `trending_worldcups` (트렌딩 월드컵)
최근 7일 활동 기반 인기 월드컵

## 🔐 보안 (RLS)

### 정책 특징
- **Categories**: 모든 사용자 읽기 가능
- **User Interactions**: 본인 데이터만 관리, 모든 사용자 읽기 가능
- **Comments**: 삭제되지 않은 댓글 모든 사용자 읽기, 작성자만 수정/삭제
- **Game Sessions**: 모든 사용자 읽기/생성, 플레이어만 수정
- **Notifications**: 본인 알림만 조회/수정

## 🚀 마이그레이션 순서

1. **스키마 생성**: `complete-migration-guide-fixed.sql`
2. **데이터 마이그레이션**: `data-migration-only-fixed.sql`
3. **랭킹 뷰 생성**: `create-ranking-views.sql`

## 🎯 핵심 개선사항

### 1. 데이터 정규화
- 4개의 분리된 좋아요/북마크 테이블 → 1개의 `user_interactions` 테이블
- 중복 제거 및 일관성 향상

### 2. 성능 최적화
- 적절한 인덱스 설정
- 실시간 통계를 위한 뷰 활용
- 트리거를 통한 자동 통계 업데이트

### 3. 확장성
- JSONB 메타데이터로 유연한 데이터 저장
- 상호작용 타입 확장 가능
- 게임 세션 상세 추적

### 4. 사용자 경험
- 회원/비회원 통합 지원
- 계층형 댓글
- 실시간 랭킹 시스템

## 📝 개발 가이드

### 새로운 상호작용 타입 추가
```sql
-- user_interactions 테이블의 CHECK 제약조건 수정
ALTER TABLE user_interactions DROP CONSTRAINT user_interactions_interaction_type_check;
ALTER TABLE user_interactions ADD CONSTRAINT user_interactions_interaction_type_check 
    CHECK (interaction_type IN ('like', 'bookmark', 'follow', 'report', 'block', 'new_type'));
```

### 새로운 알림 타입 추가
```sql
-- notifications 테이블의 CHECK 제약조건 수정
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('like_worldcup', 'comment_worldcup', 'follow_user', 'new_notification_type'));
```

## 🔧 유지보수

### 백업 전략
- 마이그레이션 전 자동 백업 테이블 생성
- 중요 테이블의 정기 백업 권장

### 모니터링 포인트
- `user_interactions` 테이블 크기 증가율
- 랭킹 뷰 성능
- 게임 세션 완주율

---

> 📅 마지막 업데이트: 2025-07-02  
> 🔄 스키마 버전: v2.0 (통합 상호작용 시스템)