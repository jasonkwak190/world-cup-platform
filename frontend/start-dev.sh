#!/bin/bash

# 개발 서버 안정적 시작 스크립트

echo "🔧 환경 설정 및 프로젝트 정리 중..."

# Node.js 버전 확인 함수
check_node_version() {
    local current_version=$(node --version 2>/dev/null | sed 's/v//')
    local required_major=18
    
    if [ -z "$current_version" ]; then
        return 1
    fi
    
    local major_version=$(echo $current_version | cut -d. -f1)
    
    if [ "$major_version" -lt "$required_major" ]; then
        return 1
    fi
    
    return 0
}

# Node.js 설치 함수
install_node() {
    echo "🚀 Node.js 설치 중..."
    
    if command -v brew &> /dev/null; then
        echo "📦 Homebrew로 Node.js 설치 중..."
        brew install node@20
        export PATH="/opt/homebrew/bin:$PATH"
        export PATH="/usr/local/bin:$PATH"
    else
        echo "❌ Homebrew가 설치되지 않았습니다."
        echo "🔗 다음 링크에서 Node.js를 직접 설치해주세요:"
        echo "   https://nodejs.org/ko/download/"
        echo "   또는 Homebrew 설치: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
}

# Node.js 버전 확인 및 설정
if command -v nvm &> /dev/null; then
    echo "📍 nvm으로 Node.js 버전 설정 중..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # .nvmrc 파일이 있으면 해당 버전 사용
    if [ -f ".nvmrc" ]; then
        nvm use 2>/dev/null || nvm install 20
    else
        nvm use 20 2>/dev/null || nvm install 20
    fi
    
    echo "✅ Node.js $(node --version) 사용 중"
elif ! check_node_version; then
    echo "⚠️  Node.js 버전이 부족합니다. 현재: $(node --version 2>/dev/null || echo '없음'), 필요: v18+"
    read -p "🤔 Node.js를 자동으로 설치하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_node
    else
        echo "❌ Node.js 18+ 버전이 필요합니다. 설치 후 다시 실행해주세요."
        exit 1
    fi
else
    echo "✅ Node.js $(node --version) 사용 중"
fi

# 기존 프로세스 종료
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true

# 캐시 정리
rm -rf .next
rm -rf node_modules/.cache

echo "🚀 개발 서버 시작 중..."

# 의존성 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성 설치 중..."
    npm install
fi

# 개발 서버 시작
npm run dev

echo "✅ 개발 서버가 http://localhost:3000 에서 실행 중입니다"