# 📄 CLAUDE.md - PRD for Enhanced World Cup Platform

## 🧭 프로젝트 개요

* **프로젝트명**: 차세대 커뮤니티형 이상형 월드컵 플랫폼
* **목표**: PIKU 대비 향상된 UX/UI, 확장성, 편의성 제공
* **핵심 가치**: 직관적 인터페이스, 빠른 로딩, 사용자 중심 설계

## 🎯 PIKU 분석 기반 개선사항

### 📱 UI/UX 향상
* **반응형 그리드**: 4-6열 → 디바이스별 최적화 (모바일 2열, 태블릿 3열, 데스크톱 4-6열)
* **이미지 최적화**: WebP/AVIF 포맷, 점진적 로딩, 블러 플레이스홀더
* **인터랙션 개선**: 호버 효과, 부드러운 전환 애니메이션
* **접근성**: 키보드 네비게이션, 스크린 리더 지원, 고대비 모드

### ⚡ 성능 최적화
* **무한 스크롤**: 가상화로 10,000+ 항목 대응
* **지연 로딩**: Intersection Observer API 활용
* **프리페칭**: 사용자 의도 예측 기반 콘텐츠 미리 로드
* **캐싱 전략**: Service Worker + 메모리 캐시

### 🔧 편의성 기능
* **빠른 시작**: 원클릭 월드컵 생성 (템플릿 제공)
* **진행 상태 저장**: 로컬 스토리지 + 세션 복구
* **키보드 단축키**: 
  - 화살표키 (←/→) 선택
  - Spacebar 재생/일시정지 (영상)
  - Esc 되돌리기
  - Enter 다음 라운드
* **제스처 지원**: 스와이프 선택 (모바일)

## 🏗 핵심 기능 상세

### 🎮 월드컵 플레이
```
- 토너먼트 브라켓 시각화
- 실시간 진행률 표시 (16강 → 8강 → ...)
- 예상 완료 시간 표시
- 되돌리기 무제한 (히스토리 스택)
- 결과 공유 (이미지 생성)
```

### 🛠 콘텐츠 생성
```
- 드래그 앤 드롭 업로드
- 유튜브 URL 자동 파싱 (시작/종료 시간)
- 이미지 자동 크롭/리사이징
- 실시간 미리보기
- 템플릿 기반 빠른 생성
```

### 📊 통계 및 랭킹
```
- 실시간 투표 결과
- 항목별 승률 통계
- 라운드별 인기도 분석
- 트렌딩 월드컵 (시간대별)
- 사용자 참여 통계
```

### 🌐 소셜 기능
```
- 댓글 시스템 (대댓글 지원)
- 좋아요/북마크
- 공유 기능 (URL + 이미지)
- 팔로우/구독 (제작자)
- 월드컵 시리즈 연결
```

## 📐 개선된 정보 아키텍처

### 메인 페이지 레이아웃
```
Header: 로고, 검색, 카테고리, 사용자 메뉴
Filters: 정렬 (인기/최신/참여많은순), 카테고리 탭
Grid: 카드 그리드 (무한스크롤)
Footer: 링크, 정보
```

### 카드 컴포넌트 구조
```
- 썸네일 (16:9 비율 고정)
- 제목 (2줄 말줄임)
- 제작자 + 생성일
- 통계 (참여자수, 댓글수)
- 액션 버튼 (시작하기, 북마크, 공유)
```

## 🛡 콘텐츠 관리

### 자동 필터링
```
- 이미지 해시 기반 중복 검출
- 텍스트 필터링 (욕설, 부적절한 내용)
- 신고 시스템 (커뮤니티 자정)
- 관리자 검토 큐
```

### 저작권 보호
```
- 워터마크 자동 추가
- 출처 표기 필수
- DMCA 신고 시스템
- 라이선스 정보 표시
```

## 🔧 기술 스택

### Frontend
```typescript
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS + Headless UI
- Framer Motion (애니메이션)
- React Hook Form + Zod
- Zustand (상태관리)
- React Query (서버상태)
```

### Backend
```typescript
- Node.js + Express
- PostgreSQL (메인 DB)
- Redis (캐시, 세션)
- S3 (파일 저장)
- Socket.io (실시간)
- Bull (큐 시스템)
```

### DevOps
```
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Vercel (Frontend 배포)
- AWS/Railway (Backend 배포)
- Sentry (에러 모니터링)
```

## 📈 단계별 개발 계획

### Phase 1 - Core MVP (4주)
- [ ] 월드컵 플레이 기본 기능
- [ ] 콘텐츠 생성/업로드
- [ ] 반응형 UI 구현
- [ ] 기본 통계 기능

### Phase 2 - 커뮤니티 (3주)
- [ ] 댓글/좋아요 시스템
- [ ] 사용자 인증/프로필
- [ ] 검색/필터링
- [ ] 공유 기능

### Phase 3 - 고도화 (3주)
- [ ] 실시간 기능
- [ ] 관리자 도구
- [ ] 성능 최적화
- [ ] 모니터링 구축

## 🎨 디자인 시스템

### 컬러 팔레트
```css
Primary: #10B981 (에메랄드)
Secondary: #3B82F6 (블루)
Accent: #F59E0B (앰버)
Neutral: #6B7280 (그레이)
```

### 타이포그래피
```css
제목: 'Pretendard' 700
본문: 'Pretendard' 400
캡션: 'Pretendard' 300
```

### 컴포넌트 가이드
- 카드: 둥근 모서리 8px, 그림자 subtle
- 버튼: 라운드 6px, 호버 효과
- 입력: 보더 1px, 포커스 링

### 꼭 숙지 할 것
- 기능을 추가할 땐 테스트를 먼저 만드는 TDD 방식으로 개발해줘.
- 코드를 짜고 나면, rail test 명령을 통해 테스트가 잘 성공하는지 반드시 확인하도록 해.
- test 코드를 추가할 땐 minitest를 사용해. Rspec은 쓰지마, fixtures를 추가할 땐 내게 물어보고 추가해.

## 🤖 Claude MCP 설정

### 초기 설정 (새로운 컴퓨터에서 처음 실행 시)

```bash
# 프로젝트 루트에서 실행
./setup-claude-mcp.sh
```

### MCP 서버 기능
- **Memory**: 대화 내용 기억 및 관리
- **Sequential Thinking**: 복잡한 문제 단계별 해결  
- **Filesystem**: 프로젝트 파일 접근 최적화
- **GitHub**: 저장소 관리 (API 키 필요)
- **Brave Search**: 웹 검색 (API 키 필요)
- **Gemini CLI**: 대용량 파일 분석 (API 키 필요)

### API 키 설정 (선택사항)
```bash
# .claude/mcp_servers.json 파일에서 설정 (Git에 커밋되지 않음)
# 또는 ~/.config/claude/mcp_servers.json 파일에서 설정
GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxx"
BRAVE_API_KEY="BSAxxxxx" 
GEMINI_API_KEY="AIzaSyxxxxx"
```

### ⚠️ 보안 주의사항
- **API 키 파일은 Git에 커밋되지 않습니다** (.gitignore 처리됨)
- 템플릿 파일(`.template`)만 저장소에 포함됩니다
- 실제 API 키는 로컬 환경에서만 관리됩니다
- 팀 공유 시에는 각자 API 키를 개별 설정해야 합니다

### 사용법
- Claude CLI 재시작 후 자동으로 MCP 서버 연결
- `@` 문법으로 대용량 파일 분석: `gemini -p "@src/ 전체 코드 구조 분석해줘"`


# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results



---

> 본 문서는 이상형 월드컵 플랫폼 설계서입니다.