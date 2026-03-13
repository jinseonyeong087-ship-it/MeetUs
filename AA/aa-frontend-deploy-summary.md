# AA 클라우드 및 배포 작업 정리

AI Minutes 프로젝트에서 AA 파트가 수행한 클라우드 사용 경험, 프론트 배포 구성 정리, 환경 구분, AWS 배포 증적을 정리한 문서입니다.

본 문서는 프론트 구현 자체보다 AWS 사용 경험과 배포 구조 이해, 환경별 운영 구분, 배포 산출물 정리에 초점을 둡니다.

---

## 1) 프로젝트 목표

이 프로젝트에서 AA 파트가 중점적으로 가져간 목표는 아래와 같습니다.

- 클라우드 기반 서비스 배포 구조 이해
- AWS 프론트 배포 경험 정리
- 환경별 운영 기준 문서화
- 화면, API, 배포 문서 간 정합성 확보

---

## 2) AA 작업 범위

### 2.1 문서화

- [화면설계서](./ui-spec.md)
- [사용자 흐름도](./user-flow.md)
- [API 연동 문서](./api-integration.md)
- [Frontend 시스템 설계](./frontend-system-design.md)
- [배포 구조 문서](./deployment-architecture.md)

### 2.2 배포 관련 산출물

- [frontend/Dockerfile](../frontend/Dockerfile)
- [frontend/runtime-config.js](../frontend/runtime-config.js)
- [frontend/deploy/taskdef-frontend.template.json](../frontend/deploy/taskdef-frontend.template.json)
- [frontend/deploy/appspec-frontend.yaml](../frontend/deploy/appspec-frontend.yaml)

### 2.3 수행 내용

- 프론트 사용자 흐름 문서화
- Core API 연동 기준 정리
- 상태값 기반 UI 문서 정리
- Frontend Docker 이미지 및 ECS 배포 구조 정리
- ALB, Target Group, Task Definition, CodeDeploy 기준 배포 흐름 정리
- AWS 콘솔 증적 정리

---

## 3) 배포 구조 요약

AA 파트에서 정리한 배포 기준은 프론트 서비스의 AWS 배포 구조입니다.

### 3.1 구성 요소

| 구성 요소 | 역할 |
| --- | --- |
| `ALB` | 외부 요청 진입점 |
| `ECS Fargate` | 프론트 컨테이너 실행 |
| `ECR` | 프론트 Docker 이미지 저장 |
| `CodeDeploy` | ECS 배포 및 트래픽 전환 |
| `Core API` | 프론트와 연동되는 백엔드 API |

### 3.2 관련 파일

- [frontend/Dockerfile](../frontend/Dockerfile)
- [frontend/deploy/taskdef-frontend.template.json](../frontend/deploy/taskdef-frontend.template.json)
- [frontend/deploy/appspec-frontend.yaml](../frontend/deploy/appspec-frontend.yaml)

---

## 4) 환경 구분

운영 환경은 `local`, `dev`, `stage`, `prod` 4개로 구분합니다.

| 환경 | 목적 | 실행 기준 | 진입점 | 배포 기준 |
| --- | --- | --- | --- | --- |
| `local` | 개인 개발 및 기본 확인 | 로컬 실행 | `localhost` | 화면 및 API 연결 확인 |
| `dev` | 팀 통합 개발 | 개발 배포본 | dev URL 또는 내부 ALB | 기능 연동 및 상태 흐름 확인 |
| `stage` | 운영 전 검증 | 운영 유사 환경 | stage ALB DNS | 배포 검증 및 리허설 |
| `prod` | 실제 운영 | 운영 배포본 | 운영 도메인 또는 운영 ALB | 실서비스 운영 및 롤백 대응 |

### 4.1 Local

- 로컬 브라우저 기준 개발 및 기능 확인 환경
- UI와 API 연결 여부 점검

### 4.2 Dev

- 팀 단위 통합 개발 환경
- 프론트와 Core API 연동 검증

### 4.3 Stage

- 운영 전 검증 환경
- ECS, ALB, Task Definition, CodeDeploy 흐름 확인

### 4.4 Prod

- 실제 운영 환경
- 운영값 기준 배포 및 장애 대응

---

## 5) 배포 경험 정리

AA 파트 기준 배포 경험은 아래 항목으로 정리할 수 있습니다.

- Docker 이미지 빌드 구조 확인
- ECR 이미지 저장소 사용 경험
- ECS Task Definition 기반 배포 구조 확인
- ALB, Listener, Target Group 연결 구조 확인
- CodeDeploy 기반 배포 흐름 확인
- 배포 후 서비스 상태 및 증적 확인

---

## 6) 상태값 기준 정리

프론트 문서와 API 문서에서 공통으로 사용하는 회의 상태값은 아래와 같습니다.

| 상태 | 의미 |
| --- | --- |
| `CREATED` | 회의 메타데이터 생성 완료 |
| `UPLOADED` | 오디오 업로드 완료 |
| `PROCESSING` | AI 처리 진행 중 |
| `COMPLETED` | 결과 생성 완료 |
| `FAILED` | 처리 실패 |

---

## 7) AWS 배포 증적

### 7.1 인프라 및 배포 증적

- [IAM User](./img/IAMuser.png)
- [ECR Repository](./img/ECRrepository.png)
- [ECS Cluster](./img/ECS_cluster.png)
- [ECS Task Definition](./img/ECS_Task_Definition.png)
- [ECS Service](./img/ECS_service.png)
- [Target Group](./img/targetgroup.png)
- [Security Group](./img/security_group.png)
- [ALB 생성](./img/ALB_create.png)
- [Listener 생성](./img/Listener_create.png)

### 7.2 서비스 흐름 및 화면 증적

- [AA 시스템 흐름](./img/AAsystemflow.png)
- [AA CI/CD 흐름](./img/AAcicdflow.png)
- [프론트 화면](./img/front.png)

---

## 8) 정리

- AA는 클라우드 사용 경험과 배포 구조 이해를 목표로 문서와 배포 기준을 정리했습니다.
- AA는 AWS 프론트 배포에 필요한 주요 리소스와 흐름을 정리했습니다.
- AA는 `local`, `dev`, `stage`, `prod` 4개 환경 구분을 문서화했습니다.
- AA는 발표와 증적 정리에 사용할 수 있도록 AWS 콘솔 자료를 정리했습니다.

---

## 9) 프로젝트 전체 요약

AI Minutes 프로젝트는 사용자가 회의 음성 파일을 업로드하면 전사, 요약, 결정사항, 개인별 To-Do를 생성하고 이를 다시 조회할 수 있도록 구성된 서비스입니다.

전체 구조는 프론트엔드, Core API, AI 처리 파이프라인, 데이터 저장소, AWS 배포 리소스로 나뉘며, 각 파트가 연결되어 회의 생성부터 결과 조회까지의 흐름을 완성합니다.

- 프론트엔드는 사용자 화면과 업로드, 목록, 상세 조회를 담당합니다.
- Core API는 회의 생성, 업로드 제어, 상태 관리, 결과 조회를 담당합니다.
- AI 파이프라인은 음성 데이터를 처리해 전사와 요약 결과를 생성합니다.
- 데이터 저장소는 회의 메타데이터와 결과 데이터를 보관합니다.
- AWS 리소스는 서비스 배포, 라우팅, 저장, 로그 수집을 담당합니다.

이 프로젝트는 단순 화면 구현보다 업로드, 비동기 처리, 상태 관리, 결과 조회, 클라우드 배포까지 이어지는 전체 서비스 흐름을 경험하고 정리하는 데 목적이 있습니다.

---

## 10) 참고 문서

- [AA/README.md](./README.md)
- [AA/ui-spec.md](./ui-spec.md)
- [AA/user-flow.md](./user-flow.md)
- [AA/api-integration.md](./api-integration.md)
- [AA/frontend-system-design.md](./frontend-system-design.md)
- [AA/deployment-architecture.md](./deployment-architecture.md)
