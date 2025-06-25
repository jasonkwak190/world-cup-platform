#!/bin/bash

# 개발 서버 안정적 시작 스크립트

echo "🔧 프로젝트 정리 중..."

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