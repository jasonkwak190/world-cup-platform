# Claude MCP 설정

이 폴더는 Claude가 Supabase 데이터베이스에 직접 접근할 수 있게 해주는 MCP(Model Context Protocol) 서버를 포함합니다.

## 파일 구조

```
.claude/
├── .mcp.json              # MCP 서버 설정 (실제 설정, Git 제외)
├── .env                   # 환경변수 (실제 값, Git 제외)
├── supabase-mcp-server.js # Supabase MCP 서버
├── .mcp.json.template     # MCP 설정 템플릿 (Git 포함)
├── .env.template          # 환경변수 템플릿 (Git 포함)
└── README.md              # 이 파일
```

**참고**: MCP 서버는 frontend 프로젝트의 node_modules를 사용합니다 (cwd 설정).

## 설정 방법

### 1. 환경변수 설정
```bash
# .env 파일에 실제 값 입력 (이미 완료됨)
SUPABASE_URL=https://rctoxfcyzzsiikopbsne.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Claude 재시작
Claude를 완전히 종료하고 다시 시작하여 MCP 서버를 인식하게 합니다.

### 3. 사용 가능한 도구들

#### Supabase 도구들
- **query_database**: SQL 쿼리 실행
- **list_tables**: 모든 테이블 목록 조회
- **describe_table**: 테이블 스키마 정보 조회
- **get_table_data**: 테이블 샘플 데이터 조회

#### 기타 MCP 도구들
- **filesystem**: 파일 시스템 접근
- **github**: GitHub 저장소 관리
- **memory**: 대화 기억 및 관리
- **sequential-thinking**: 복잡한 문제 단계별 해결
- **gemini-cli**: 대용량 파일 분석

## 사용 예시

### 테이블 목록 확인
```
Claude: list_tables 도구를 사용해서 현재 데이터베이스의 모든 테이블을 보여줘
```

### 테이블 구조 확인
```
Claude: describe_table 도구를 사용해서 worldcups 테이블의 스키마를 보여줘
```

### 데이터 조회
```
Claude: get_table_data 도구를 사용해서 worldcups 테이블의 샘플 데이터 10개를 보여줘
```

### SQL 쿼리 실행
```
Claude: query_database 도구를 사용해서 "SELECT count(*) FROM worldcups" 쿼리를 실행해줘
```

## 보안

- `.env` 파일과 `.mcp.json` 파일은 Git에 커밋되지 않습니다
- Service Role Key를 사용하므로 모든 데이터에 접근 가능합니다
- 로컬 환경에서만 사용하세요

## 문제 해결

### MCP 서버가 인식되지 않는 경우
1. Claude 완전 재시작
2. .env 파일의 환경변수 확인
3. npm install이 정상적으로 완료되었는지 확인

### 권한 오류가 발생하는 경우
1. SUPABASE_SERVICE_ROLE_KEY가 올바른지 확인
2. Supabase 프로젝트 설정에서 Service Role이 활성화되어 있는지 확인