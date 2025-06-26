This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 요구사항
- Node.js 20.x (권장)
- npm 10.x 이상

### 환경 설정

#### 🚨 Node.js 버전 문제 해결
만약 Node.js 버전이 부족하다는 오류가 발생하면:

```bash
# 자동 Node.js 설정 스크립트 실행
./setup-node.sh
```

#### 수동 설정
이 프로젝트는 Node.js 18+ 버전이 필요합니다.

```bash
# Homebrew 사용 (권장)
brew install node@20

# nvm 사용
nvm install 20
nvm use 20
```

### 개발 서버 실행

**방법 1: 자동 스크립트 (권장)**
```bash
./start-dev.sh
```

**방법 2: 직접 실행**
```bash
npm install
npm run dev
```

### 🔧 문제 해결
- **SyntaxError: Unexpected token ?**: Node.js 버전이 부족함 → `./setup-node.sh` 실행
- **next: command not found**: 의존성 설치 필요 → `npm install` 실행
- **포트 3000 사용 중**: 다른 서버 종료 또는 다른 포트 사용

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
