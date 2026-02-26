# TA 역할 정의서 (Core API + DB Owner)

## 역할 개요
TA는 Core API 개발과 DB 총괄 설계를 담당한다.

---

## 1. 기능 책임
- Meeting 생성 API
- 상태 관리 API
- AI 호출 트리거 API
- 회의 목록 API
- 상태 전환 로직

---

## 2. DB 총괄 책임
- ERD 설계
- DDL 작성
- FK/인덱스 설계
- 상태 ENUM 설계
- 데이터 무결성 보장
- 스키마 버전 관리

### 대상 테이블
1. meetings
2. transcripts
3. summaries
4. todos
5. users (선택)
6. processing_logs

---

## 3. Docker
- Core 서비스 Dockerfile 작성
- Multi-stage 빌드 적용
- Health check 포함

---

## 4. GitHub Actions
- `core.yml` 작성
- Docker build
- ECR push

---

## 5. AWS 배포 책임
- Core ECR 구성
- IAM Role 설정
- `Deployment.yaml` / `Service.yaml` 작성
- Blue/Green 배포 전략 적용

---

## 6. 산출물
- ERD
- DB 설계서
- 상태 흐름 다이어그램
- Core API 명세서
