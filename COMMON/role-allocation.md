# 역할 분배표 (AA)

## 👤 TA – Core API + DB Owner

### 🔹 기능 책임
- Meeting 생성 API
- 상태 관리 API
- AI 호출 트리거 API
- 회의 목록 API
- 상태 전환 로직

### 🔹 DB 책임 (총괄)
- ERD 설계
- DDL 작성
- 인덱스 설계
- 상태 ENUM 설계
- 데이터 무결성 유지

---

### 🔹 Docker
- core Dockerfile
- multi-stage
- health check

---

### 🔹 GitHub Actions
- core.yml
- Docker build
- ECR push

---

### 🔹 AWS
- Core ECR
- IAM Role
- ECS Service
- Task Definition
- Rolling Update

---

### 🔹 산출물
- ERD
- DB 설계서
- 상태 흐름 다이어그램
- API 명세서 (Core)

---

## 👤 SA – AI Processing Service

### 🔹 기능 책임
- Transcribe 연동
- 요약 API
- To-Do 추출 로직
- AI 상태 업데이트
- 에러 처리 로직

---

### 🔹 Docker
- AI Dockerfile
- Slim image
- health endpoint

---

### 🔹 GitHub Actions
- ai.yml
- Docker build
- ECR push

---

### 🔹 AWS
- AI ECR
- IAM (Transcribe/S3 권한)
- ECS Service
- Task Definition
- Retry Log 운영 기준

---

### 🔹 산출물
- AI 처리 흐름도
- Prompt 설계 문서
- To-Do 추출 설계서
- 리소스 제어 전략 문서

---

## 👤 AA – Frontend + Archive API

### 🔹 기능 책임
- 파일 업로드 UI
- 상태 표시 UI
- 회의 상세 페이지
- 담당자별 To-Do 카드
- Archive 조회 API (조회/필터/정렬)

---

### 🔹 Docker
- Front Dockerfile
- Nginx 설정
- health endpoint

---

### 🔹 GitHub Actions
- frontend.yml
- Docker build
- ECR push

---

### 🔹 AWS
- Front ECR
- ALB 연동
- ECS Service
- Task Definition
- Rolling Update

---

### 🔹 산출물
- 화면 설계서
- 사용자 흐름도
- API 연동 문서
- 배포 구조 문서
