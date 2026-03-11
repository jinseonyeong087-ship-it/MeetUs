# AI Pipeline Deployment Architecture (배포 구조)

본 문서는 SA 파트 코드가 운영 환경(AWS)에 자동 반영되는 CI/CD 배포 파이프라인의 핵심 인프라 흐름을 기술합니다.

## 1. 인프라스트럭처 (Infrastructure)
- **런타임 엔진:** AWS ECS (Fargate) 컨테이너 클러스터 (단일 구동 워커 방식)
- **컨테이너 저장소:** AWS ECR (`ai-minutes-sa` 레포지토리)
- **자동화 툴:** GitHub Actions (`.github/workflows/deploy-sa.yml`)
- **배포 컨트롤러:** AWS CodeDeploy (블루/그린 배포 관리)
- **보안/인증:** IAM OIDC (OpenID Connect) & 최소 권한 원칙(Least Privilege)

## 2. CI/CD 파이프라인 흐름

`GitHub Push -> GitHub Actions 트리거 -> AWS OIDC 연동 인증 -> Docker 이미지 빌드 및 ECR 업로드 -> CodeDeploy 배포 생성 -> Green Task Set 생성 및 검증(Target Group 2nd) -> ALB Listener 전환 -> 배포 완료`

1. 개발자(SA 주환)가 프로젝트 폴더에 코드를 변경하고 깃허브 `main` 브랜치에 푸시(Push) 합니다.
2. 깃허브 액션 서버(ubuntu-latest)가 깨어납니다.
3. 깃허브 액션이 AWS IAM에 OIDC 단기 토큰을 제출하며 `MeetUs-SA-GitHubActionRole` 직책을 잠시 빌려옵니다. (영구 Access Key 미사용 보안)
4. 소스코드가 `Dockerfile` 규칙에 의해 `python:3.12-slim` 운영체제 기반으로 빌드되고 ECR에 업로드됩니다.
5. CodeDeploy가 작동하여 새로운 버전의 ECS Task Set(`Green`)을 생성하고, 별도의 Target Group에서 헬스체크를 수행합니다.
6. 검증이 완료되면 ALB Production Listener를 전환(Switch)하여 신규 버전으로 트래픽을 100% 이동시킵니다. (블루/그린 무중단 배포)

## 3. OIDC (OpenID Connect) 핵심 채택 사유
기존에는 AWS Access Key와 Secret Key를 무기한 영구 발급받아 깃허브 시크릿에 텍스트로 보관하는 방식이었습니다. 하지만 이는 해커가 키를 탈취할 경우 비트코인 채굴 등 크리티컬한 계정 피싱 문제가 발생할 수 있었습니다.
이에 SA 파트에서는 **GitHub 자체를 '인증서 발급 플랫폼(Identity Provider)'으로 AWS IAM에 등재**하고, 배포가 실행되는 단 몇 분 동안만 유효한 임시 증명서(토큰)를 주고받는 최신 MSA 보안 인증 체계인 OIDC를 선진입하여 구축하였습니다.

## 4. Docker 컴파일 최적화 체계
- `.dockerignore`를 통해 `venv`, `__pycache__` 등의 무용지물 된 모듈들을 가지치기하여 최종 빌드 이미지 용량을 비약적으로 줄이고 빌드타임을 가속하고 있습니다.
