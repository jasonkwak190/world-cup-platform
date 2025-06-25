# 🛠 개발 환경 문제 해결 가이드

## 🚨 서버 연결 안 될 때

### 1. 기본 해결 방법 (90% 해결)
```bash
# 1. 모든 Next.js 프로세스 종료
pkill -f next

# 2. 캐시 및 의존성 완전 삭제
rm -rf .next node_modules package-lock.json

# 3. 의존성 재설치
npm install

# 4. 서버 시작
npm run dev
```

### 2. 포트 충돌 해결
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000

# 특정 포트로 실행
npm run dev -- --port 3001
```

### 3. 빌드 오류 확인
```bash
# 빌드 테스트
npm run build

# 린트 확인
npm run lint
```

## ⚠️ 주의사항

### 이미지 관련 오류 방지
- Next.js Image 컴포넌트 대신 CSS 기반 플레이스홀더 사용
- 외부 이미지 도메인 설정 시 주의

### 의존성 관리
- package-lock.json 삭제 후 재설치가 가장 확실한 방법
- node_modules 캐시 문제가 자주 발생

### 설정 파일
- Turbopack 비활성화로 안정성 확보
- TypeScript/ESLint 오류 무시하지 않기

## 🔧 안정적인 개발 환경

### 권장 시작 명령어
```bash
npm run dev  # Turbopack 비활성화된 안정 모드
```

### 문제 발생 시 체크리스트
1. [ ] `pkill -f next` 실행
2. [ ] `.next` 폴더 삭제
3. [ ] `node_modules` 삭제
4. [ ] `npm install` 재실행
5. [ ] `npm run build` 테스트
6. [ ] `npm run dev` 실행

이 가이드를 따르면 99% 해결됩니다! 🚀