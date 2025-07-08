# 🏆 차세대 이상형 월드컵 플랫폼

UX/UI, 확장성, 편의성을 제공하는 커뮤니티형 이상형 월드컵 플랫폼입니다.

## 🚀 빠른 시작

### 1. 프로젝트 클론 및 설치
```bash
git clone [repository-url]
cd world-cup-platform
```

### 2. 프론트엔드 설정
```bash
cd frontend
npm install
npm run dev
```

### 3. Claude MCP 설정 (개발용)
```bash
# 프로젝트 루트에서 실행
./setup-claude-mcp.sh
```

## ⚙️ 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn
- Claude CLI (MCP 사용 시)

### Claude MCP 기능
- **Memory**: 대화 내용 기억 및 관리
- **Sequential Thinking**: 복잡한 문제 단계별 해결
- **Filesystem**: 프로젝트 파일 접근 최적화
- **GitHub**: 저장소 관리 (API 키 필요)
- **Brave Search**: 웹 검색 (API 키 필요)
- **Gemini CLI**: 대용량 파일 분석 (API 키 필요)

## 📋 개발 가이드

자세한 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## 🛠 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS + Headless UI
- Framer Motion
- React Hook Form + Zod
- Zustand (상태관리)
- React Query (서버상태)

### Backend
- Node.js + Express
- PostgreSQL (메인 DB)
- Redis (캐시, 세션)
- S3 (파일 저장)
- Socket.io (실시간)
- Bull (큐 시스템)

## 🎯 주요 기능

- 🎮 토너먼트 방식 월드컵 플레이
- 🛠 드래그 앤 드롭 콘텐츠 생성
- 📊 실시간 통계 및 랭킹
- 🌐 댓글/좋아요/북마크 소셜 기능
- 📱 반응형 디자인
- ⚡ 무한 스크롤 및 가상화

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.