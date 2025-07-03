#!/bin/bash

# Claude MCP 설정 자동화 스크립트
# 다른 컴퓨터에서 프로젝트 사용 시 실행

echo "🚀 Claude MCP 설정을 시작합니다..."
echo ""

# OS 확인
OS_TYPE=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_TYPE="Linux"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS_TYPE="Windows"
else
    OS_TYPE="Unknown"
fi

echo "🖥️  감지된 OS: $OS_TYPE"

# Claude 설정 디렉토리 생성
CLAUDE_CONFIG_DIR="$HOME/.config/claude"
mkdir -p "$CLAUDE_CONFIG_DIR"

# 템플릿에서 MCP 설정 파일 생성
if [ -f ".claude/mcp_servers.json.template" ]; then
    # 현재 프로젝트 경로로 filesystem 서버 경로 업데이트
    PROJECT_PATH=$(pwd)
    sed "s|\"\\.\"|\"$PROJECT_PATH\"|g" .claude/mcp_servers.json.template > "$CLAUDE_CONFIG_DIR/mcp_servers.json"
    echo "✅ MCP 서버 설정이 생성되었습니다: $CLAUDE_CONFIG_DIR/mcp_servers.json"
    
    # 로컬 설정 파일도 생성 (개발용)
    cp .claude/mcp_servers.json.template .claude/mcp_servers.json
    sed -i '' "s|\"\\.\"|\"$PROJECT_PATH\"|g" .claude/mcp_servers.json
    echo "✅ 로컬 MCP 설정 파일이 생성되었습니다: .claude/mcp_servers.json"
    echo "⚠️  API 키는 .claude/mcp_servers.json 파일에 직접 입력하세요 (Git에 커밋되지 않음)"
else
    echo "❌ .claude/mcp_servers.json.template 파일을 찾을 수 없습니다."
    exit 1
fi

# 의존성 확인 및 설치 안내
echo ""
echo "🔍 의존성 확인 중..."

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되지 않았습니다."
    echo "   설치 방법: https://nodejs.org/"
    MISSING_DEPS=true
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
fi

# npm 확인
if ! command -v npm &> /dev/null; then
    echo "❌ npm이 설치되지 않았습니다."
    MISSING_DEPS=true
else
    NPM_VERSION=$(npm --version)
    echo "✅ npm: v$NPM_VERSION"
fi

# Claude CLI 확인
if ! command -v claude &> /dev/null; then
    echo "❌ Claude CLI가 설치되지 않았습니다."
    echo "   설치 방법: https://docs.anthropic.com/en/docs/claude-code"
    MISSING_DEPS=true
else
    CLAUDE_VERSION=$(claude --version)
    echo "✅ Claude CLI: $CLAUDE_VERSION"
fi

# Gemini CLI 확인 (선택사항)
if ! command -v gemini &> /dev/null; then
    echo "⚠️  Gemini CLI가 설치되지 않았습니다 (선택사항)"
    echo "   설치 방법: npm install -g @google/generative-ai-cli"
else
    echo "✅ Gemini CLI: 설치됨"
fi

if [ "$MISSING_DEPS" = true ]; then
    echo ""
    echo "❌ 필수 의존성이 누락되었습니다. 위의 설치 방법을 참고하여 설치 후 다시 실행해주세요."
    exit 1
fi

echo ""
echo "🔧 API 키 설정 방법:"
echo "1. GitHub Personal Access Token: .claude/mcp_servers.json 에서 GITHUB_PERSONAL_ACCESS_TOKEN 설정"
echo "2. Gemini API Key: .claude/mcp_servers.json 에서 GEMINI_API_KEY 설정"
echo ""
echo "📋 다음 단계:"
echo "1. API 키를 .claude/mcp_servers.json 파일에 입력"
echo "2. Claude CLI 재시작: Ctrl+C 후 새 터미널에서 'claude' 실행"
echo "3. 프로젝트 디렉토리에서 Claude CLI 실행하면 MCP 자동 연결"
echo ""
echo "🎉 MCP 설정이 완료되었습니다!"
echo "💡 팁: 다른 컴퓨터에서는 이 스크립트만 실행하면 동일한 환경 구성됩니다."