# 🤖 Claude MCP 설정 가이드

## 🚀 빠른 설정 (새로운 컴퓨터)

```bash
# 1. 프로젝트 클론
git clone [your-repository-url]
cd world-cup-platform

# 2. MCP 자동 설정
./setup-claude-mcp.sh

# 3. API 키 입력 (선택사항)
# .claude/mcp_servers.json 파일에서 API 키 입력

# 4. Claude CLI 재시작
# Ctrl+C 후 새 터미널에서 'claude' 실행
```

## 📋 필수 요구사항

### 필수 설치
- **Node.js** 18+ : https://nodejs.org/
- **Claude CLI** : https://docs.anthropic.com/en/docs/claude-code

### 선택 설치
- **Gemini CLI** : `npm install -g @google/generative-ai-cli`

## 🔧 MCP 서버 기능

### 1. **Memory** (항상 사용 가능)
```bash
# 대화 내용 기억 및 관리
# 프로젝트 맥락 유지
```

### 2. **Sequential Thinking** (항상 사용 가능)
```bash
# 복잡한 문제를 단계별로 해결
# 논리적 사고 과정 추적
```

### 3. **Filesystem** (항상 사용 가능)
```bash
# 프로젝트 파일 최적화된 접근
# 대용량 코드베이스 분석
```

### 4. **GitHub** (API 키 필요)
```bash
# 저장소 검색, 이슈 관리
# PR 생성, 코드 검색
# API 키: GitHub Settings → Developer settings → Personal access tokens
```

### 5. **Gemini CLI** (API 키 + 설치 필요)
```bash
# 대용량 파일 분석 (Claude 컨텍스트 한계 극복)
# @ 문법으로 파일/디렉토리 분석
# API 키: https://makersuite.google.com/app/apikey
```

## 🔑 API 키 설정

### 방법 1: 프로젝트 로컬 설정 (추천)
```bash
# 파일: .claude/mcp_servers.json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    },
    "gemini-cli": {
      "env": {
        "GEMINI_API_KEY": "AIzaSy_your_key_here"
      }
    }
  }
}
```

### 방법 2: 전역 설정
```bash
# 파일: ~/.config/claude/mcp_servers.json
# 위와 동일한 형식
```

## 🛡️ 보안 주의사항

- ✅ `.claude/mcp_servers.json` → Git에서 자동 제외
- ✅ `.claude/mcp_servers.json.template` → Git에 포함 (API 키 없음)
- ✅ 팀 공유 시 각자 API 키 개별 설정
- ❌ API 키를 Git에 커밋하지 마세요

## 🔄 다른 컴퓨터 이동 시

1. **프로젝트 클론**
2. **`./setup-claude-mcp.sh` 실행**
3. **API 키 입력** (개인 키)
4. **Claude CLI 재시작**

## 🎯 사용 예시

### Gemini로 대용량 코드 분석
```bash
gemini -p "@src/ 전체 프로젝트 구조를 분석하고 주요 컴포넌트들의 역할을 설명해줘"
gemini -p "@frontend/src/components/ React 컴포넌트들의 의존성 관계를 분석해줘"
```

### GitHub 작업
```bash
# 이슈 검색, PR 생성 등
# Claude에서 자동으로 GitHub API 사용
```

### Memory로 컨텍스트 관리
```bash
# 장기간 대화에서 중요 정보 기억
# 프로젝트 진행상황 추적
```

## ❓ 문제 해결

### MCP 서버 연결 안됨
```bash
# 1. Claude CLI 재시작
# 2. 설정 파일 경로 확인: ~/.config/claude/mcp_servers.json
# 3. JSON 문법 오류 확인
```

### Gemini CLI 작동 안됨
```bash
# 1. 설치 확인: which gemini
# 2. 로그인 확인: gemini auth login
# 3. API 키 확인: .claude/mcp_servers.json
```

### 권한 오류
```bash
# macOS/Linux: chmod +x setup-claude-mcp.sh
# Windows: Git Bash 또는 WSL 사용
```