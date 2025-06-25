# 📊 WorldCup Platform Database Design

## 🎯 설계 목표

- **확장성**: 대용량 트래픽과 데이터 처리 가능
- **성능**: 빠른 검색과 실시간 랭킹 지원
- **유연성**: 다양한 토너먼트 형식 지원
- **데이터 무결성**: 일관된 데이터 상태 보장
- **분석**: 상세한 사용자 행동 분석 가능

## 🏗 핵심 테이블 구조

### 👤 Users (사용자)
```sql
- id (UUID): 고유 식별자
- email: 이메일 (고유)
- username: 사용자명 (고유)
- display_name: 표시명
- avatar_url: 프로필 이미지
- is_verified: 인증 여부
- is_admin: 관리자 여부
```

### 📂 Categories (카테고리)
```sql
- id (SERIAL): 카테고리 ID
- name: 카테고리명 (연예인, 음식, 게임 등)
- icon: 아이콘명
- color: 테마 색상
- display_order: 표시 순서
```

### 🏆 WorldCups (월드컵)
```sql
- id (UUID): 월드컵 고유 ID
- title: 제목
- description: 설명
- creator_id: 생성자
- category_id: 카테고리
- total_items: 총 항목 수
- tournament_type: 토너먼트 형식
- status: 상태 (draft/published/archived)
- engagement 지표들 (view_count, play_count, like_count 등)
```

### 🎯 WorldCup Items (월드컵 항목)
```sql
- id (UUID): 항목 고유 ID
- worldcup_id: 소속 월드컵
- title: 항목명
- image_url/video_url: 미디어 콘텐츠
- position: 토너먼트 위치
- win_count/loss_count: 승패 통계
- win_rate: 승률 (자동 계산)
```

## 🎮 게임 시스템

### 🎯 Game Sessions (게임 세션)
- 개별 월드컵 플레이 추적
- 익명 사용자 지원 (session_token)
- 진행 상황 저장 (중간 저장 가능)

### ⚔️ Game Matches (경기 결과)
- 각 매치별 상세 기록
- 결정 시간 측정 (UX 분석용)
- 토너먼트 브라켓 재구성 가능

## 💬 커뮤니티 기능

### 💭 Comments (댓글)
- 계층형 댓글 지원 (parent_id)
- 좋아요, 고정, 삭제 상태 관리
- 내용 길이 제한 (1000자)

### ❤️ User Interactions (사용자 상호작용)
- 좋아요, 북마크, 팔로우, 신고
- 중복 방지 (UNIQUE 제약)
- 유연한 target_type 설계

## 📈 성능 최적화

### 🔍 인덱스 전략
```sql
-- 자주 조회되는 컬럼들
CREATE INDEX idx_worldcups_created_at ON worldcups(created_at DESC);
CREATE INDEX idx_worldcups_play_count ON worldcups(play_count DESC);
CREATE INDEX idx_worldcups_tags ON worldcups USING GIN(tags);

-- 조인 성능 향상
CREATE INDEX idx_worldcups_creator_id ON worldcups(creator_id);
CREATE INDEX idx_comments_worldcup_id ON comments(worldcup_id);
```

### ⚡ 자동 트리거
```sql
-- 자동 타임스탬프 업데이트
CREATE TRIGGER update_worldcups_updated_at 
    BEFORE UPDATE ON worldcups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 자동 카운터 업데이트
CREATE TRIGGER update_worldcup_play_count 
    AFTER INSERT ON game_sessions
    FOR EACH ROW EXECUTE FUNCTION update_worldcup_counters();
```

## 📊 분석 및 뷰

### 🔥 Trending WorldCups View
```sql
-- 트렌딩 점수 자동 계산
trending_score = play_count * 0.5 + like_count * 2 + comment_count * 3 + 신규보너스
```

### 📱 Recent Activity View
- 댓글 작성, 월드컵 생성 등 실시간 활동
- 통합된 피드 형태로 제공

## 🛡 보안 및 무결성

### ✅ 데이터 검증
```sql
-- 이메일 형식 검증
CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')

-- 최소 항목 수 보장
CONSTRAINT worldcups_total_items_check CHECK (total_items >= 4)

-- 미디어 필수 조건
CONSTRAINT worldcup_items_media_check CHECK (image_url IS NOT NULL OR video_url IS NOT NULL)
```

### 🔐 접근 제어
- 사용자별 권한 관리 (is_admin)
- 공개/비공개 월드컵 지원
- 신고 및 모더레이션 시스템

## 📊 확장성 고려사항

### 🚀 미래 기능 대응
- **태그 시스템**: PostgreSQL 배열로 유연한 태깅
- **다국어 지원**: 텍스트 필드 확장 가능
- **API 버전 관리**: 스키마 변경에 유연한 구조
- **분석 시스템**: JSONB로 유연한 이벤트 추적

### 📈 성능 스케일링
- **파티셔닝**: 날짜별 테이블 분할 준비
- **캐싱**: Redis 연동을 위한 구조 설계
- **검색**: Elasticsearch 연동 가능한 데이터 구조
- **CDN**: 미디어 URL 분리로 CDN 연동 용이

## 🔄 마이그레이션 전략

### 📝 버전 관리
1. **스키마 버전**: 각 마이그레이션에 버전 번호
2. **백워드 호환**: 기존 API 호환성 유지
3. **점진적 배포**: 무중단 스키마 변경
4. **롤백 계획**: 각 변경사항별 롤백 스크립트

### 🧪 테스트 데이터
```sql
-- 기본 카테고리 데이터 삽입
INSERT INTO categories (name, icon, color) VALUES
('연예인', 'star', '#EF4444'),
('음식', 'utensils', '#F59E0B'),
('게임', 'gamepad', '#3B82F6');
```

이 설계는 PIKU와 같은 월드컵 플랫폼의 모든 요구사항을 만족하면서도, 확장성과 성능을 고려한 현대적인 데이터베이스 구조입니다.