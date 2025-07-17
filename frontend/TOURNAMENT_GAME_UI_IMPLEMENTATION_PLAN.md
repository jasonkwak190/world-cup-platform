# 토너먼트 게임 UI 구현 플랜

## 📋 프로젝트 개요

현재 `/play` 월드컵 플레이 UI를 테마별로 분리하여 사용자가 선택한 테마로 일관된 경험을 제공하는 시스템을 구축합니다.

## 🎨 테마 시스템

### 사용 가능한 테마
- **neon**: 네온 사이버 스타일
- **paper**: 종이 찢기 스타일  
- **comic**: 만화책 스타일
- **minimal**: 기본 모던 스타일
- **gaming**: 게이밍 RGB 스타일

### 테마 적용 범위
1. 토너먼트 선택 화면
2. 실제 게임 화면 (카드 vs 카드)
3. 게임 결과 화면 + 댓글창
4. 랭킹 모달

## 🏗️ 구현 구조

### 1. 토너먼트 선택 화면
**경로**: `frontend/src/app/tournament-select-designs2`

#### 기존 기능 유지
- 4강, 8강, 16강 ~ 최대 512강 토너먼트 선택
- 가운데 정렬 레이아웃 (예: 4강만 있으면 중앙 정렬)

#### 새로운 기능 추가
- [ ] **토너먼트 제목 표시**: 레이아웃 상단 중앙에 눈에 띄게 배치
- [ ] **테마 선택 드롭다운**: 5가지 테마 선택 기능
- [ ] **시작 버튼**: 토너먼트 선택 후 중앙 하단 버튼 클릭
- [ ] **로딩 상태**: 버튼 클릭 시 테마별 로딩 애니메이션 + 텍스트 변경

#### 구현 파일 구조
```
tournament-select-designs2/
├── components/
│   ├── ThemeSelector.tsx          # 테마 선택 드롭다운
│   ├── TournamentTitle.tsx        # 토너먼트 제목
│   ├── StartButton.tsx            # 시작 버튼 (테마별 로딩)
│   └── themes/
│       ├── NeonTheme.tsx
│       ├── PaperTheme.tsx
│       ├── ComicTheme.tsx
│       ├── MinimalTheme.tsx
│       └── GamingTheme.tsx
├── hooks/
│   └── useThemeSelection.ts       # 테마 선택 상태 관리
└── page.tsx                       # 메인 페이지
```

### 2. 실제 게임 화면
**경로**: `frontend/src/app/tournament-play`

#### 기존 기능 유지
- [ ] **헤더 왼쪽**: 홈 버튼, 라운드 표시 (16강/준결승/결승)
- [ ] **헤더 중앙**: 프로그레스 바 + 진행률 % 표시
- [ ] **헤더 오른쪽**: 되돌리기 버튼, 다른 토너먼트 버튼
- [ ] **헤더 하단**: 라운드 정보 (몇 라운드의 몇 번째 매치)

#### 새로운 기능 추가
- [ ] **WINNER 표시**: 사용자 선택 시 테마별 승리 표시
- [ ] **투표 통계**: 선택 후 다른 사용자들의 선택 비율 표시
- [ ] **로딩 상태**: 선택 후 테마별 로딩 애니메이션
- [ ] **키보드 선택**: 기존 키보드 선택 기능 통합

#### 구현 파일 구조
```
tournament-play/
├── components/
│   ├── GameHeader.tsx             # 공통 헤더
│   ├── GameProgress.tsx           # 프로그레스 바
│   ├── VersusCards.tsx            # 대결 카드들
│   ├── WinnerIndicator.tsx        # 승리 표시
│   ├── VoteStatistics.tsx         # 투표 통계
│   ├── GameLoading.tsx            # 로딩 상태
│   └── themes/
│       ├── NeonGameTheme.tsx
│       ├── PaperGameTheme.tsx
│       ├── ComicGameTheme.tsx
│       ├── MinimalGameTheme.tsx
│       └── GamingGameTheme.tsx
├── hooks/
│   ├── useGameState.ts            # 게임 상태 관리
│   ├── useKeyboardControls.ts     # 키보드 컨트롤
│   └── useVoteStatistics.ts       # 투표 통계
└── page.tsx                       # 메인 게임 페이지
```

### 3. 게임 결과 화면
**경로**: `frontend/src/app/tournament-result`

#### 기존 기능 유지
- [ ] **기본 버튼들**: 다시하기, 홈으로, 랭킹보기, 공유하기
- [ ] **게임 정보**: 걸린시간, 토너먼트 타입 표시
- [ ] **이미지 확대**: 사진 클릭 시 전체 화면 확대

#### 레이아웃 변경
- [ ] **세로형 구성**: 기존 가로형 → 세로형 길게 변경

#### 새로운 기능 추가
- [ ] **우승자 통계**: 받은 투표수, 승률 표시
- [ ] **좋아요/북마크**: 메인 화면에서 이동 (결과창에서만 가능)
- [ ] **월드컵 제목**: 크게 표시 (좋아요/북마크 버튼 위)
- [ ] **리포트 기능**: 월드컵 리포트 버튼 추가 (추후 개발)

#### 구현 파일 구조
```
tournament-result/
├── components/
│   ├── ResultHeader.tsx           # 결과 헤더
│   ├── WinnerDisplay.tsx          # 우승자 표시
│   ├── WinnerStatistics.tsx       # 우승자 통계
│   ├── GameMetrics.tsx            # 게임 메트릭
│   ├── ActionButtons.tsx          # 액션 버튼들
│   ├── LikeBookmark.tsx           # 좋아요/북마크
│   └── themes/
│       ├── NeonResultTheme.tsx
│       ├── PaperResultTheme.tsx
│       ├── ComicResultTheme.tsx
│       ├── MinimalResultTheme.tsx
│       └── GamingResultTheme.tsx
└── page.tsx                       # 메인 결과 페이지
```

### 4. 댓글창 시스템
**경로**: `frontend/src/app/tournament-comment` (결과 화면 내 통합)

#### 기존 기능 유지
- [ ] **로그인 상태**: 닉네임 입력 없이 댓글 작성
- [ ] **비회원 상태**: 닉네임 + 댓글 입력
- [ ] **댓글 정보**: 닉네임, 작성시간, 좋아요, 답글
- [ ] **수정/삭제**: 비회원 세션 내에서만 가능

#### 새로운 기능 추가
- [ ] **신고 기능**: 신고 버튼 추가 (추후 개발)
- [ ] **레벨 시스템**: VIP/Gold/Silver/Bronze (기본: Bronze)
- [ ] **필터 기능**: 좋아요순(기본), 최근순
- [ ] **댓글 이동**: 작성 후 해당 댓글로 스크롤
- [ ] **제작자 하이라이트**: 월드컵 제작자 댓글 시 반짝임 효과

#### 구현 파일 구조
```
tournament-result/comments/
├── components/
│   ├── CommentSection.tsx         # 댓글 섹션
│   ├── CommentForm.tsx            # 댓글 작성 폼
│   ├── CommentList.tsx            # 댓글 목록
│   ├── CommentItem.tsx            # 댓글 아이템
│   ├── CommentFilter.tsx          # 필터 기능
│   ├── UserLevel.tsx              # 사용자 레벨
│   └── CreatorHighlight.tsx       # 제작자 하이라이트
├── hooks/
│   ├── useComments.ts             # 댓글 데이터 관리
│   ├── useCommentForm.ts          # 댓글 작성 폼
│   └── useCommentFilter.ts        # 댓글 필터
└── types/
    └── comment.ts                 # 댓글 타입 정의
```

### 5. 랭킹 모달
**경로**: `frontend/src/app/tournament-ranking`

#### 기존 기능 유지
- [ ] **랭킹 목록**: 기존 랭킹 시스템 유지

#### 기능 변경
- [ ] **검색 기능**: 랭킹 검색 추가
- [ ] **필터 기능**: 랭킹 필터 추가
- [ ] **Export 제거**: Export 기능 제거
- [ ] **Share 기능**: 월드컵 게임 링크 공유 기능 추가
- [ ] **통계 제거**: 전체 참가자수, 전체 투표수, 총 매치 제거

#### 구현 파일 구조
```
tournament-ranking/
├── components/
│   ├── RankingModal.tsx           # 랭킹 모달
│   ├── RankingList.tsx            # 랭킹 목록
│   ├── RankingSearch.tsx          # 검색 기능
│   ├── RankingFilter.tsx          # 필터 기능
│   ├── ShareButton.tsx            # 공유 기능
│   └── themes/
│       ├── NeonRankingTheme.tsx
│       ├── PaperRankingTheme.tsx
│       ├── ComicRankingTheme.tsx
│       ├── MinimalRankingTheme.tsx
│       └── GamingRankingTheme.tsx
├── hooks/
│   ├── useRanking.ts              # 랭킹 데이터
│   ├── useRankingSearch.ts        # 검색 기능
│   └── useRankingFilter.ts        # 필터 기능
└── types/
    └── ranking.ts                 # 랭킹 타입 정의
```

## 🔧 공통 모듈 및 시스템

### 테마 관리 시스템
```typescript
// src/contexts/ThemeContext.tsx
interface ThemeContextType {
  currentTheme: 'neon' | 'paper' | 'comic' | 'minimal' | 'gaming';
  setTheme: (theme: string) => void;
  getThemeComponents: () => ThemeComponents;
}

// src/types/theme.ts
interface ThemeComponents {
  SelectionScreen: React.Component;
  GameScreen: React.Component;
  ResultScreen: React.Component;
  RankingModal: React.Component;
}
```

### 공통 훅스
```typescript
// src/hooks/useThemeContext.ts
// 테마 컨텍스트 관리

// src/hooks/useGameFlow.ts
// 게임 플로우 상태 관리

// src/hooks/useKeyboardControls.ts
// 키보드 컨트롤 공통 로직
```

### 유틸리티 함수
```typescript
// src/utils/themeUtils.ts
// 테마 관련 유틸리티

// src/utils/gameUtils.ts
// 게임 관련 유틸리티

// src/utils/statisticsUtils.ts
// 통계 관련 유틸리티
```

## 📝 구현 체크리스트

### Phase 1: 기본 구조 설정
- [ ] 테마 컨텍스트 시스템 구축
- [ ] 공통 훅스 및 유틸리티 함수 작성
- [ ] 타입 정의 완료
- [ ] 기본 컴포넌트 구조 설정

### Phase 2: 토너먼트 선택 화면
- [ ] 테마 선택 드롭다운 구현
- [ ] 토너먼트 제목 표시 기능
- [ ] 시작 버튼 및 로딩 상태
- [ ] 5가지 테마별 UI 통합

### Phase 3: 실제 게임 화면
- [ ] 게임 헤더 및 프로그레스 구현
- [ ] WINNER 표시 시스템
- [ ] 투표 통계 표시 기능
- [ ] 키보드 컨트롤 통합
- [ ] 테마별 게임 UI 통합

### Phase 4: 게임 결과 화면
- [ ] 세로형 레이아웃 구현
- [ ] 우승자 통계 표시
- [ ] 좋아요/북마크 기능 이동
- [ ] 월드컵 제목 크게 표시
- [ ] 리포트 기능 버튼 추가

### Phase 5: 댓글 시스템
- [ ] 댓글 섹션 구현
- [ ] 신고 기능 추가
- [ ] 레벨 시스템 구현
- [ ] 필터 기능 (좋아요순/최근순)
- [ ] 댓글 이동 기능
- [ ] 제작자 하이라이트 기능

### Phase 6: 랭킹 모달
- [ ] 검색 기능 구현
- [ ] 필터 기능 구현
- [ ] Share 기능 추가
- [ ] Export 기능 제거
- [ ] 불필요한 통계 제거

### Phase 7: 테스트 및 최적화
- [ ] 테마별 기능 테스트
- [ ] 성능 최적화
- [ ] 코드 리팩토링
- [ ] 사용하지 않는 코드 제거

## ⚠️ 주의사항

1. **파일 분할**: 하나의 page.tsx에 모든 코드를 담지 말고 컴포넌트별로 분할
2. **테마 분리**: 테마를 한 곳에 몰아넣지 말고 각각 별도 파일로 관리
3. **코드 복제**: 기존 테마 Mock 코드는 그대로 두고 복제하여 실제 코드로 대체
4. **모듈화**: 중복 코드 방지를 위한 모듈화 및 Clean Code 적용
5. **API 최적화**: 비효율적인 API 호출 방지
6. **코드 정리**: 사용하지 않는 모듈 제거

## 🎯 목표

사용자가 토너먼트 선택 화면에서 테마를 선택하면, 해당 테마로 게임 플레이부터 결과 화면까지 일관된 UI/UX를 제공하는 시스템을 구축하여 몰입도 높은 게임 경험을 제공합니다.