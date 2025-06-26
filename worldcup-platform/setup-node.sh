#!/bin/bash

# Node.js 환경 설정 스크립트

echo "🔧 Node.js 환경 설정 시작..."

# 현재 Node.js 버전 확인
current_version=$(node --version 2>/dev/null)
echo "📍 현재 Node.js 버전: ${current_version:-'설치되지 않음'}"

# 필요한 버전 확인
required_version="18"
if [ ! -z "$current_version" ]; then
    major_version=$(echo $current_version | sed 's/v//' | cut -d. -f1)
    if [ "$major_version" -ge "$required_version" ]; then
        echo "✅ Node.js 버전이 충분합니다!"
        exit 0
    fi
fi

echo "⚠️  Node.js ${required_version}+ 버전이 필요합니다."
echo ""
echo "🚀 Node.js 설치 옵션:"
echo "1. Homebrew 사용 (권장)"
echo "2. 공식 웹사이트에서 다운로드"
echo "3. nvm 사용"
echo ""

read -p "설치 방법을 선택하세요 (1-3): " choice

case $choice in
    1)
        echo "📦 Homebrew로 Node.js 설치 중..."
        if ! command -v brew &> /dev/null; then
            echo "🍺 Homebrew 설치 중..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install node@20
        echo "✅ Node.js 설치 완료!"
        ;;
    2)
        echo "🔗 브라우저에서 다음 링크를 열어주세요:"
        echo "   https://nodejs.org/ko/download/"
        echo "   LTS 버전을 다운로드하고 설치해주세요."
        ;;
    3)
        echo "📦 nvm 설치 및 Node.js 설정 중..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20
        nvm use 20
        echo "✅ nvm 및 Node.js 설치 완료!"
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

echo ""
echo "🔄 새 터미널을 열거나 다음 명령어를 실행하여 환경을 새로고침하세요:"
echo "   source ~/.bashrc   # 또는 source ~/.zshrc"
echo ""
echo "✅ 설정이 완료되었습니다! ./start-dev.sh 를 실행해보세요."