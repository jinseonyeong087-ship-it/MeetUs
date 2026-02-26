# SA 역할 정의서 (AI Processing Service)

## 역할 개요
SA는 음성 처리 및 AI 기반 요약/To-Do 추출 파이프라인을 담당한다.

---

## 1. 기능 책임
- AWS Transcribe 연동
- 회의 요약 API 구현
- 개인별 To-Do 추출 로직
- AI 처리 상태 업데이트
- 에러 처리 및 재시도 로직

---

## 2. Docker
- AI 서비스 Dockerfile 작성
- Slim 이미지 최적화
- Health endpoint 포함

---

## 3. GitHub Actions
- `ai.yml` 작성
- Docker build
- ECR push

---

## 4. AWS 배포 책임
- AI ECR 구성
- IAM 권한 설정 (Transcribe/S3)
- `Deployment.yaml` 작성
- HPA 설정
- Blue/Green 배포 전략 적용

---

## 5. 산출물
- AI 처리 흐름도
- Prompt 설계 문서
- To-Do 추출 설계서
- 리소스 제어 전략 문서
