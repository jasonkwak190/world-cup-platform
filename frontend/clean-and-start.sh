#!/bin/bash

# 컴퓨터 바꿀 때마다 실행할 스크립트
echo "🧹 Cleaning caches and dependencies..."

# 모든 캐시 파일 삭제
rm -rf .next
rm -rf node_modules/.cache
rm -rf ~/.npm/_cacache
rm -rf node_modules

# 의존성 재설치
echo "📦 Reinstalling dependencies..."
npm install

# 개발 서버 시작
echo "🚀 Starting development server..."
npm run dev