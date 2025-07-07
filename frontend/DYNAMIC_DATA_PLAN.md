# 메인 페이지 하드코딩 데이터를 실제 데이터로 변경하는 플랜

## 📋 현재 상황 분석

### 🔍 하드코딩된 부분들
1. **TrendingRanking 컴포넌트** (`/src/components/TrendingRanking.tsx`)
   - 하드코딩된 `trendingData` 배열 (라인 3-40)
   - 고정된 참여자 수와 제목들

2. **RecentComments 컴포넌트** (`/src/components/RecentComments.tsx`)
   - 하드코딩된 `recentComments` 배열 (라인 3-36)
   - 고정된 댓글 내용과 작성자들

3. **메인 페이지** (`/src/app/page.tsx`)
   - 고정된 `totalPages = 16` (라인 23)

### ✅ 기존 인프라 확인
- ✅ Supabase 연결 설정 완료
- ✅ Comments 시스템 구현됨 (`/src/utils/comments.ts`)
- ✅ 게임 통계 시스템 존재 (`/src/utils/gameStats.ts`)
- ✅ Play count 추적 시스템 존재 (`/src/utils/playCount.ts`)

## 🚀 구현 플랜

### Phase 1: API 엔드포인트 생성

#### 1.1 인기 월드컵 API 생성
```typescript
// /src/app/api/trending/route.ts
// 기능: 최근 24시간 플레이 수 기준 인기 월드컵 순위 (정적 데이터)
// 페이지 새로고침 시에만 업데이트
```

#### 1.2 최근 댓글 API 생성  
```typescript
// /src/app/api/comments/recent/route.ts
// 기능: 전체 월드컵의 최근 댓글 목록 (정적 데이터)
// 페이지 새로고침 시에만 업데이트
```

#### 1.3 통계 API 개선
```typescript
// /src/app/api/stats/overview/route.ts
// 기능: 전체 페이지 수, 월드컵 수 등 개괄 통계
```

### Phase 2: 데이터베이스 스키마 확인 및 보완

#### 2.1 필요한 필드들
- `worldcups.play_count` - 플레이 횟수 추적
- `worldcups.view_count` - 조회수 추적
- `worldcups.created_at` - 생성일 (트렌드 분석용)
- `comments.created_at` - 댓글 작성일

#### 2.2 인덱스 최적화
- `worldcups(play_count DESC, created_at DESC)` - 인기도 정렬용
- `comments(created_at DESC)` - 최근 댓글 정렬용

### Phase 3: 컴포넌트 리팩토링

#### 3.1 TrendingRanking 컴포넌트 개선
```typescript
// 변경사항:
// - 하드코딩 데이터 제거
// - 페이지 로드 시 API 호출로 실제 데이터 로드
// - 로딩 상태 및 에러 처리 추가
// - 정적 구성 (새로고침 시에만 업데이트)
```

#### 3.2 RecentComments 컴포넌트 개선
```typescript
// 변경사항:
// - 하드코딩 데이터 제거  
// - 페이지 로드 시 댓글 데이터 로드
// - 월드컵 제목 링크 연결
// - 상대적 시간 표시 (방금 전, 1분 전 등)
// - 정적 구성 (새로고침 시에만 업데이트)
```

#### 3.3 Pagination 개선
```typescript
// 변경사항:
// - 고정된 totalPages 제거
// - 실제 월드컵 수량 기반 페이지 계산
// - 동적 페이지 사이즈 지원
```

### Phase 4: 성능 최적화

#### 4.1 캐싱 전략 (정적 구성)
- **인기 월드컵**: 5분 캐시 (새로고침 시에만 갱신)
- **최근 댓글**: 2분 캐시 (새로고침 시에만 갱신)
- **통계 데이터**: 10분 캐시 (새로고침 시에만 갱신)

#### 4.2 데이터 업데이트 방식
- 사용자 새로고침/페이지 진입 시에만 최신 데이터 로드
- 백그라운드 실시간 업데이트 없음
- 단순하고 안정적인 정적 구성

### Phase 5: 사용자 경험 개선

#### 5.1 로딩 상태
- 스켈레톤 UI 적용
- 점진적 로딩 (순차적 데이터 표시)

#### 5.2 에러 처리
- 네트워크 오류 시 기본값 표시
- 수동 새로고침 안내

#### 5.3 인터랙션 추가
- 인기 월드컵 클릭 시 해당 페이지로 이동
- 댓글 클릭 시 해당 월드컵으로 이동

## 📁 파일 구조

```
src/
├── app/api/
│   ├── trending/route.ts           # 인기 월드컵 API
│   ├── comments/recent/route.ts    # 최근 댓글 API
│   └── stats/overview/route.ts     # 전체 통계 API
├── components/
│   ├── TrendingRanking.tsx         # 개선된 인기 순위
│   ├── RecentComments.tsx          # 개선된 최근 댓글
│   └── skeletons/                  # 로딩 UI
│       ├── TrendingSkeleton.tsx
│       └── CommentsSkeleton.tsx
├── hooks/
│   ├── useTrending.ts             # 인기 데이터 훅
│   ├── useRecentComments.ts       # 댓글 데이터 훅
│   └── useStats.ts                # 통계 데이터 훅
└── types/
    ├── trending.ts                # 인기 데이터 타입
    └── stats.ts                   # 통계 데이터 타입
```

## 🎯 예상 효과

### 개선 전 (현재)
- ❌ 하드코딩된 가짜 데이터
- ❌ 실제 사용자 활동 반영 안됨
- ❌ 정적인 사용자 경험

### 개선 후
- ✅ 실제 사용자 데이터 기반
- ✅ 페이지 새로고침 시 최신 트렌드 반영
- ✅ 간단하고 안정적인 정적 구성
- ✅ SEO 및 사용자 참여도 향상
- ✅ 서버 부하 최소화 (실시간 업데이트 없음)

## 🔄 우선순위
1. **High**: TrendingRanking 실제 데이터 연동
2. **High**: RecentComments 실제 데이터 연동  
3. **Medium**: 성능 최적화 및 캐싱
4. **Low**: 고급 UX 기능 (인터랙션 등)

## 💡 구현 접근법
- **정적 구성**: 실시간 업데이트 없음
- **새로고침 기반**: 사용자가 페이지를 새로고침할 때만 데이터 업데이트
- **캐싱 활용**: 서버 부하 최소화 및 성능 향상
- **에러 핸들링**: 네트워크 문제 시 graceful fallback

## 📝 작업 체크리스트

### API 생성
- [ ] `/api/trending/route.ts` - 인기 월드컵 API
- [ ] `/api/comments/recent/route.ts` - 최근 댓글 API  
- [ ] `/api/stats/overview/route.ts` - 통계 API

### 타입 정의
- [ ] `/types/trending.ts` - 인기 데이터 타입
- [ ] `/types/stats.ts` - 통계 데이터 타입

### 컴포넌트 리팩토링
- [ ] `TrendingRanking.tsx` 실제 데이터 연동
- [ ] `RecentComments.tsx` 실제 데이터 연동
- [ ] 메인 페이지 pagination 수정

### 커스텀 훅
- [ ] `useTrending.ts` 생성
- [ ] `useRecentComments.ts` 생성
- [ ] `useStats.ts` 생성

### UI 개선
- [ ] 스켈레톤 UI 컴포넌트 생성
- [ ] 로딩 상태 처리
- [ ] 에러 상태 처리

### 테스트 및 최적화
- [ ] 빌드 테스트
- [ ] 캐싱 구현
- [ ] 성능 최적화