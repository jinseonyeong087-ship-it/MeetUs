# 배포 구조 문서 (AA)

## 1. 목표
Frontend 서비스를 ECS(Fargate) 기반으로 배포하고, Core API 및 AI Processing Service와 연동 가능한 단일 운영 구조를 제공한다.

---

## 2. 구성 요소
- Frontend Service (Nginx + 정적 파일)
- Core API Service
- AI Processing Service
- RDS (`t3.micro`)
- S3 (음성 파일 저장)
- ALB 1개

---

## 3. 컨테이너 전략
- Front Dockerfile
  - 정적 파일을 Nginx로 서빙
- 헬스체크 엔드포인트 제공
- 이미지 태깅: `frontend:<git-sha>`

---

## 4. CI/CD (GitHub Actions)
- 워크플로우 파일: `frontend.yml`
- 단계:
  1. 테스트/빌드
  2. Docker 이미지 빌드
  3. ECR Push
  4. ECS 서비스 반영

---

## 5. ECS 배포
- ECS Service
  - Rolling Update
  - 헬스체크 기반 태스크 교체
- Task Definition
  - 컨테이너 포트 및 리소스 정의
- ALB
  - 외부 라우팅
  - 헬스체크 연동

---

## 6. 배포 전략
- Rolling Update 적용
- ALB 헬스체크 통과 후 신규 태스크 전환
- dev/prod 분리 없는 단일 운영 환경 기준

---

## 7. 운영 체크리스트
- 환경변수(API Base URL) 검증
- CORS 정책 확인
- 정적 리소스 캐시 정책 확인
- 로그/모니터링 대시보드 연결
