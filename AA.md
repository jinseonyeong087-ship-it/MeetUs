# AA 역할 정의서 (Frontend + Archive API)

## 역할 개요
AA는 사용자 UI 및 회의 아카이브 조회 API를 담당한다.

---

## 1. 기능 책임
- 파일 업로드 UI
- 처리 상태 표시 UI
- 회의 상세 페이지
- 담당자별 To-Do 카드 UI
- Archive 조회 API (조회/필터/정렬)

---

## 2. Docker
- Front 서비스 Dockerfile 작성
- Nginx 설정
- Health endpoint 포함

---

## 3. GitHub Actions
- `frontend.yml` 작성
- Docker build
- ECR push

---

## 4. AWS 배포 책임
- Front ECR 구성
- Ingress / LoadBalancer 설정
- `Deployment.yaml` 작성
- Blue/Green 배포 전략 적용

---

## 5. 산출물
- 화면 설계서
- 사용자 흐름도
- API 연동 문서
- 배포 구조 문서
