# 배포 구조 문서 (AA)

## 1. 목표
Frontend 서비스를 ECS(Fargate), ALB, CodeDeploy 기반 Blue-Green 구조로 배포하고, Core API 및 AI Processing Service와 연동 가능한 단일 운영 구조를 제공한다.

### 1.1 적용 범위
- Frontend: Vanilla JS, Nginx, Docker
- Backend: Python API
- Cloud: AWS ECS(Fargate), ALB, ECR, S3, SQS, RDS
- CI/CD: GitHub Actions, CodeDeploy, Blue-Green 배포

### 1.2 배포 설계 원칙
- 외부 사용자 요청은 ALB를 단일 진입점으로 받는다.
- Frontend와 Core API는 ECS(Fargate) 기반으로 운영한다.
- 원본 파일은 S3에 저장하고 비동기 처리 요청은 SQS를 통해 전달한다.
- AI Processing Service는 비동기 작업을 전담하고 결과를 RDS에 저장한다.
- 배포는 CodeDeploy 기반 Blue-Green 방식으로 수행한다.
- 운영 비용은 소규모 프로젝트 기준 최소 구성으로 통제한다.

---

## 2. 구성 요소
- Frontend Service (Nginx + 정적 파일)
- Core API Service
- AI Processing Service
- RDS (`t3.micro`)
- S3 (음성 파일 저장)
- SQS (AI 처리 요청 큐)
- ECR (컨테이너 이미지 저장소)
- ALB 1개
- Target Group 2개 (`Blue`, `Green`)
- CodeDeploy
- CloudWatch Logs / CloudWatch Alarms

### 2.1 구성 요소 역할
| 구성 요소 | 역할 |
|---|---|
| Frontend Service | 사용자 UI 제공, API 호출, Presigned URL 기반 업로드 수행 |
| Core API Service | 인증, 회의 생성, 업로드 제어, 상태 관리, 조회 API 제공 |
| AI Processing Service | SQS 메시지 소비, Transcribe/Amazon Bedrock (Claude 3) 호출, 결과 저장 |
| ALB | 외부 사용자 요청의 단일 진입점, Blue-Green 트래픽 전환 대상 |
| S3 | `m4a` 원본 파일 저장, 필요 시 처리 산출물 저장 |
| SQS | 비동기 AI 처리 요청 큐 |
| RDS | 회의 메타데이터, transcript, 요약, 결정사항, To-Do 저장 |
| ECR | Frontend, Core API, AI Service 이미지 저장 |
| CodeDeploy | ECS Blue-Green 배포 제어 및 롤백 |
| CloudWatch | 로그 수집, 지표 감시, 알림 연계 |

### 2.2 전체 배포 아키텍처 흐름
1. 사용자가 브라우저에서 서비스에 접속한다.
2. 요청은 ALB로 유입되고 현재 운영 중인 Target Group으로 전달된다.
3. Frontend ECS가 정적 리소스를 제공하고 사용자 액션에 따라 Core API를 호출한다.
4. Core API는 회의 생성, 업로드 URL 발급, 상태 조회, 결과 조회를 처리한다.
5. 오디오 파일은 Frontend가 Presigned URL을 사용해 S3에 직접 업로드한다.
6. 업로드 완료 후 Core API는 SQS에 AI 처리 메시지를 발행한다.
7. AI Processing Service는 SQS 메시지를 소비하고 S3의 원본 파일을 읽는다.
8. AI Processing Service는 AWS Transcribe와 Amazon Bedrock (Claude 3)를 호출해 transcript, 요약, 개인별 To-Do를 생성한다.
9. 처리 결과는 RDS에 저장되고 회의 상태는 `COMPLETED` 또는 `FAILED`로 갱신된다.
10. 사용자는 Frontend를 통해 Archive 또는 상세 화면에서 결과를 조회한다.

### 2.3 요청 흐름 요약
`사용자 브라우저 → ALB → ECS Frontend → Core API → S3 / SQS → AI Processing Service → AWS Transcribe / Amazon Bedrock (Claude 3) → RDS`

---

## 3. 컨테이너 전략
- Front Dockerfile
  - 정적 파일을 Nginx로 서빙
- 헬스체크 엔드포인트 제공
- 이미지 태깅: `frontend:<git-sha>`

### 3.1 서비스별 컨테이너 기준
| 서비스 | 런타임 | 배포 단위 | 비고 |
|---|---|---|---|
| Frontend Service | Nginx + 정적 파일 | ECS Task | Vanilla JS 번들 결과물 서빙 |
| Core API Service | Python API | ECS Task | 인증, 업로드 제어, 상태 관리 |
| AI Processing Service | Python Worker | ECS Task | SQS 소비, AI 파이프라인 처리 |

### 3.2 이미지 관리 전략
- 이미지 태그는 기본적으로 Git SHA를 사용한다.
- 서비스별 이미지는 ECR 리포지토리를 분리하거나 명확한 태그 규칙으로 구분한다.
- 롤백 시 직전 안정 버전 이미지를 재사용할 수 있어야 한다.

### 3.3 환경 변수 관리
#### ECS Task Definition 환경 변수 예시
| 변수명 | 설명 |
|---|---|
| `API_BASE_URL` | Frontend가 호출할 Core API Base URL |
| `AWS_REGION` | 리전 정보 |
| `S3_BUCKET_NAME` | 오디오 파일 저장 버킷 이름 |
| `SQS_QUEUE_URL` | AI 처리 요청 큐 URL |
| `RDS_HOST` | RDS 엔드포인트 |
| `RDS_PORT` | RDS 포트 |
| `RDS_DB_NAME` | 데이터베이스 이름 |
| `BEDROCK_MODEL_ID` | Amazon Bedrock (Claude 3) 모델 ID |
| `TRANSCRIBE_REGION` | AWS Transcribe 호출 리전 |
| `LOG_LEVEL` | 애플리케이션 로그 레벨 |

#### 환경 변수 관리 전략
- 일반 설정값은 ECS Task Definition 환경 변수로 관리한다.
- 민감한 값은 AWS Secrets Manager 또는 SSM Parameter Store를 통해 주입한다.
- 환경 변수는 코드에 하드코딩하지 않는다.
- 배포 시 GitHub Actions와 ECS Task Definition 버전 관리로 변경 이력을 남긴다.

---

## 4. CI/CD (GitHub Actions)
- 워크플로우 파일: `frontend.yml`
- 단계:
  1. 테스트/빌드
  2. Docker 이미지 빌드
  3. ECR Push
  4. CodeDeploy 배포 실행
  5. ECS Blue-Green 전환

### 4.1 CI/CD 흐름
1. 개발자가 GitHub 저장소에 코드를 푸시한다.
2. GitHub Actions가 테스트와 빌드를 수행한다.
3. 빌드된 이미지를 Docker로 패키징한다.
4. 이미지를 ECR에 Push한다.
5. CodeDeploy가 신규 ECS Task Set을 생성한다.
6. Green Task Set의 헬스체크 성공 시 ALB Listener를 전환한다.
7. 실패 시 CodeDeploy가 기존 Target Group으로 롤백한다.

### 4.2 배포 산출물
- Frontend Docker 이미지
- ECS Task Definition 리비전
- CodeDeploy AppSpec 또는 배포 설정
- GitHub Actions 실행 로그

### 4.3 배포 검증 항목
- Nginx 정적 파일 정상 서빙
- Frontend에서 Core API Base URL 정상 연결
- ALB 헬스체크 정상 응답
- 정적 리소스 404 없음
- 주요 화면 진입 가능 여부 확인

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

### 5.1 네트워크 구조
| 영역 | 배치 리소스 | 설명 |
|---|---|---|
| Public Subnet | ALB, Production Listener | 외부 인터넷 요청 수신 |
| Private Subnet | Frontend ECS, Core API ECS, AI Processing ECS | 애플리케이션 서비스 실행 |
| Private Subnet | RDS | 외부 직접 접근 차단 |
| AWS Managed Service | S3, SQS, ECR, CloudWatch | 스토리지, 큐, 이미지, 모니터링 |

### 5.2 VPC 기준 요청 흐름
1. 사용자는 인터넷을 통해 ALB에 접근한다.
2. ALB는 Public Subnet에 위치하며 현재 활성 Target Group으로 트래픽을 전달한다.
3. Frontend ECS와 Core API ECS는 Private Subnet에서 동작한다.
4. Core API는 S3에 Presigned URL을 발급하고 SQS에 비동기 작업 메시지를 발행한다.
5. AI Processing Service는 Private Subnet에서 SQS 메시지를 소비한다.
6. AI Processing Service는 외부 API 호출을 위해 NAT 또는 AWS 관리형 outbound 경로를 사용해 AWS Transcribe 및 Amazon Bedrock (Claude 3)에 접근한다.
7. RDS는 Private Subnet에 배치되어 ECS 서비스에서만 접근 가능하다.

### 5.3 외부 API 호출 구조
- AI Processing Service → AWS Transcribe
- AI Processing Service → Amazon Bedrock (Claude 3) API
- 외부 API 호출은 Frontend가 아니라 백엔드 워커에서만 수행한다.
- 외부 API 인증 키는 환경 변수 또는 Secret 관리 서비스로 주입한다.

### 5.4 보안 정책
#### Security Group 정책
- ALB Security Group은 80/443 인바운드만 허용한다.
- ECS Security Group은 ALB Security Group에서 오는 애플리케이션 포트만 허용한다.
- RDS Security Group은 ECS Security Group에서 오는 DB 포트만 허용한다.
- 불필요한 서비스 간 인바운드 포트는 차단한다.

#### ALB 접근 정책
- 외부 사용자 트래픽은 ALB를 통해서만 유입한다.
- ALB는 공개 진입점이지만 백엔드 서비스는 직접 공개하지 않는다.
- 헬스체크 경로는 최소한의 공개 범위로 제한한다.

#### RDS 접근 제한
- RDS는 Public 접근을 허용하지 않는다.
- Core API 및 AI Processing Service만 DB 연결을 허용한다.
- DB 계정은 운영 계정과 애플리케이션 계정을 분리한다.

#### S3 접근 정책
- 업로드는 Presigned URL 기반으로만 허용한다.
- 버킷은 퍼블릭 공개를 금지한다.
- 애플리케이션 Role은 필요한 Prefix에만 읽기/쓰기 권한을 가진다.

#### 최소 권한 원칙
- ECS Task Role은 서비스별 필요한 AWS 권한만 부여한다.
- Frontend Task는 S3/SQS/RDS 직접 접근 권한을 가지지 않는다.
- Core API는 S3 Presigned URL 발급과 SQS 발행에 필요한 권한만 가진다.
- AI Processing Service는 SQS 소비, S3 읽기, RDS 쓰기, Transcribe 호출에 필요한 권한만 가진다.

---

## 6. 배포 전략
- Blue-Green 배포 적용
- 신규 버전은 Green Task Set으로 배포
- CodeDeploy가 Green 헬스체크 검증 후 ALB Listener를 Blue에서 Green으로 전환
- 실패 시 직전 Target Group으로 즉시 롤백
- dev/prod 분리 없는 단일 운영 환경 기준

### 6.1 트래픽 전환 전략
- ALB Production Listener는 항상 하나의 Target Group만 활성 처리한다.
- 신규 배포는 현재 운영 슬롯 반대편 Task Set에 배치한다.
- Green 검증 실패 시 사용자 트래픽은 기존 Blue에 유지된다.
- 전환 후 오류가 감지되면 즉시 이전 Target Group으로 복귀한다.

### 6.2 서비스 운영 전략
- Frontend와 Core API는 사용자 요청 처리를 담당한다.
- AI Processing Service는 사용자 직접 요청 경로에서 분리된 비동기 서비스로 운영한다.
- 업로드와 결과 조회는 즉시 응답하고, AI 처리는 상태 기반 비동기로 처리한다.

### 6.3 비용 고려 사항
- Fargate는 최소 Task 수 기준으로 운영한다.
- RDS는 `t3.micro` 단일 인스턴스 기준으로 운영한다.
- ALB는 단일 인스턴스로 유지한다.
- CloudWatch Logs 보관 기간은 30일로 제한한다.
- Multi-AZ, HPA, 고급 추적 도구는 적용하지 않는다.
- 대용량 저장 또는 장기 보관 정책은 별도 비용 검토 후 확장한다.

---

## 7. 운영 체크리스트
- 환경변수(API Base URL) 검증
- CORS 정책 확인
- 정적 리소스 캐시 정책 확인
- ECS 로그의 CloudWatch Logs 수집 확인
- ALB 5xx, RDS CPU, RDS Connection, `FAILED` 증가 알림 확인
- CloudWatch Logs 30일 보관 설정 확인
- Email 알림 채널 연결 확인

### 7.1 로그 및 모니터링
#### CloudWatch Logs 수집 구조
- Frontend ECS 로그는 CloudWatch Logs로 수집한다.
- Core API ECS 로그는 CloudWatch Logs로 수집한다.
- AI Processing Service 로그는 CloudWatch Logs로 수집한다.
- 서비스별 Log Group을 분리하여 운영한다.
- 로그에는 시각, 서비스명, 로그 레벨, 요청 또는 회의 식별자를 포함한다.

#### ALB 및 인프라 로그
- ALB Access Log를 활성화하여 요청 추적이 가능하도록 한다.
- ALB 5xx, Target 5xx, 응답 지연 지표를 모니터링한다.
- RDS CPU, DB Connection, 오류 징후를 감시한다.

#### CloudWatch Alarm 예시
- ALB 5xx 증가
- ECS Task 비정상 종료 또는 헬스체크 실패
- RDS CPU 증가
- 회의 상태 `FAILED` 증가

### 7.2 장애 대응 시나리오
| 장애 상황 | 사용자 영향 | 복구 전략 | 알림 전략 |
|---|---|---|---|
| ALB 장애 | 서비스 전체 접속 불가 또는 지연 | ALB 상태 확인, 직전 안정 구성 점검, DNS 및 Listener 설정 복구 | CloudWatch Alarm, Email 알림 |
| ECS Task 실패 | 일부 또는 전체 화면/API 응답 실패 | ECS가 Task 재기동, 필요 시 CodeDeploy 롤백 | ECS 서비스 이벤트 알림, Email 알림 |
| S3 업로드 실패 | 파일 업로드 불가, 회의 생성 후 진행 중단 | Presigned URL 재발급, 재업로드 유도, 네트워크 상태 확인 | 애플리케이션 오류 로그, 사용자 오류 메시지 |
| AI 처리 실패 | 결과 생성 지연 또는 `FAILED` 상태 노출 | 재시도 정책 적용, 최종 실패 시 재처리 수행 | `FAILED` 증가 감지, AI Service 오류 로그, Email 알림 |
| DB 연결 실패 | 목록/상세 조회 및 결과 저장 실패 | DB 연결 상태 점검, 애플리케이션 재시도, 필요 시 서비스 재배포 | RDS 지표 알림, 애플리케이션 오류 로그 |

### 7.3 운영 점검 기준
- 배포 직후 주요 화면 진입 여부를 확인한다.
- 업로드부터 결과 조회까지 핵심 사용자 흐름을 점검한다.
- CloudWatch Alarm 상태를 배포 전후 비교한다.
- AI 처리 실패 건수와 ECS 오류 로그를 함께 확인한다.
- ALB Access Log와 애플리케이션 로그를 연계해 장애 원인을 추적한다.
