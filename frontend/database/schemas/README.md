# Database Schemas

이 폴더는 World Cup Platform의 데이터베이스 스키마와 RLS 정책을 관리합니다.

## 현재 파일들

### current-schema.sql
- 현재 운영 중인 데이터베이스 스키마
- MCP를 통해 실제 데이터베이스에서 추출한 구조
- 테이블 정의, 인덱스, 외래키 제약조건 포함

### current-rls-policies.sql
- Row Level Security 정책 정의
- 사용자 권한 및 데이터 접근 제어
- 테이블별 CRUD 권한 관리

## 업데이트 방법

1. MCP Supabase 서버를 통해 실제 DB 구조 조회
2. 변경사항 확인 후 스키마 파일 업데이트
3. RLS 정책 변경 시 정책 파일 업데이트

## 주의사항

- 스키마 변경 시 반드시 실제 데이터베이스와 동기화 필요
- RLS 정책 변경 시 보안 영향 검토 필수
- 마이그레이션 전 백업 권장