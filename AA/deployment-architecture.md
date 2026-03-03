# 배포 구조 문서 (AA)

## 1. 목표
Frontend 서비스를 ECS(Fargate), ALB, CodeDeploy 기반 Blue-Green 구조로 배포하고, Core API 및 AI Processing Service와 연동 가능한 단일 운영 구조를 제공한다.

---

## 2. 구성 요소
- Frontend Service (Nginx + 정적 파일)
- Core API Service
- AI Processing Service
- RDS (`t3.micro`)
- S3 (음성 파일 저장)
- ALB 1개
- Target Group 2개 (`Blue`, `Green`)
- CodeDeploy

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
  4. CodeDeploy 배포 실행
  5. ECS Blue-Green 전환

---

## 5. ECS 배포
- ECS Service
  - Blue/Green Task Set 운영
  - 현재 운영 슬롯과 신규 배포 슬롯 분리
- Task Definition
  - 컨테이너 포트 및 리소스 정의
- ALB
  - 외부 라우팅
  - Production Listener 기반 트래픽 전환
  - Blue/Green Target Group 연결
- CodeDeploy
  - Green Task Set 생성
  - Listener 전환
  - 롤백 제어

---

## 6. 배포 전략
- Blue-Green 배포 적용
- 신규 버전은 Green Task Set으로 배포
- CodeDeploy가 Green 헬스체크 검증 후 ALB Listener를 Blue에서 Green으로 전환
- 실패 시 직전 Target Group으로 즉시 롤백
- dev/prod 분리 없는 단일 운영 환경 기준

---

## 7. 운영 체크리스트
- 환경변수(API Base URL) 검증
- CORS 정책 확인
- 정적 리소스 캐시 정책 확인
- 로그/모니터링 대시보드 연결
