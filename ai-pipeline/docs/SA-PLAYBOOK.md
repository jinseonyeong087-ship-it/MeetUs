# 📖 SA 작업 플레이북 (SA-Playbook)
이 문서는 개발 환경 재구축 및 성공한 코드 로직을 복기하기 위한 기록입니다.

## 🚀 데일리 작업 시작 루틴 (WSL/Ubuntu 기준)
1. **프로젝트 폴더 이동:** `cd ~/workspace/AI-Minutes/ai-pipeline`
   - **작업툴 터미널:** `cd ai-pipeline`
2. **가상환경 활성화:** `source venv/bin/activate`
3. **의존성 확인 (필요 시):** `pip install -r requirements.txt`
4. **도구 작동 확인:** `git --version` 및 `aws --version` 체크

## 📐 프로젝트 환경 및 규칙 (Environment & Conventions)
### 공통 기술 스택 (버전 통일 엄수)
* **OS:** `Ubuntu 24.04 LTS` (로컬 및 Docker 베이스 이미지 표준)
* **Node.js:** `v24.14.0` (NVM을 통한 관리 권장)
* **Python:** `3.12` (반드시 `venv` 가상환경 위에서 의존성 격리 후 실행)

### 네이밍 컨벤션 (Naming Conventions)
* **데이터베이스 (DB):** 모든 테이블명 및 컬럼명은 `snake_case`를 사용합니다. (예: `meeting_id`, `created_at`)
* **기본키 (PK):** 모든 DB 테이블의 PK는 내부적으로 큰 정수타입을 사용합니다. (`Long`, 파이썬 `int`)
* **API 및 코드 레벨 (Python):** 전사 백엔드가 파이썬(Python) 기반이므로, 모든 변수명과 API 응답 필드명은 `snake_case`를 엄수합니다.

### Git 브랜치 전략
* **작업 규칙:** 모든 기능 개발은 각자의 역할이 명시된 `feat/[이름]-[역할]` 브랜치에서 진행 후 Pull Request(PR)를 통해 병합합니다. (예: `feat/juhn-sa`)

## 🧠 SA 내부 아키텍처 및 모듈 설계
### 디렉토리 구조 (Directory Layout)
AI 로직은 유지보수와 단위 테스트(Unit Test)의 용이성을 위해 단일 스크립트가 아닌, 철저히 분리된 역할 단위로 구성됩니다.

```text
ai-pipeline/
├── .env                  # (Git 제외) AWS 연동 핵심 보안 키 
├── docs/                 # 기획, 아키텍처, 기능 명세 및 플레이북 가이드
└── src/                  # 파이썬 메인 소스코드 디렉토리
    ├── config.py         # 1. 중앙 환경 변수 로드 및 통제소
    ├── sqs_listener.py   # 2. 메시지 수신 및 전체 파이프라인(Main) 컨트롤러 
    ├── core/             # 3. AI 변환 코어 비즈니스 로직
    │   ├── stt_processor.py # 음성 -> 텍스트 변환 (AWS Transcribe, S3 URI 보정 포함)
    │   └── llm_processor.py # 텍스트 -> 요약/할일 JSON 변환 (Amazon Bedrock Claude 3.5 Sonnet)
    └── network/          # 4. 외부 통신 로직
        └── api_client.py    # 결과물 DB 적재를 위한 Core API 서버 통신
```

### 모듈별 세부 역할 및 Flow
#### ⚙️ 시스템 컨트롤: `config.py` & `sqs_listener.py`
*   `config.py`: `.env` 파일을 로드하여 AWS 키 등을 파이썬 변수로 메모리에 올립니다. 모든 보안 키는 오직 여기서만 관리됩니다.
*   `sqs_listener.py`: 파이프라인의 심장입니다. AWS SQS를 24시간 롱 폴링(20초 대기)하다가 `UPLOADED` 이벤트 메시지가 오면 낚아채서 `stt` -> `llm` -> `api` 모듈들을 순서대로 지휘(Orchestrate)합니다. **(최대 3회 실패 시 FAILED 처리 로직 포함)**

#### 🧠 코어 로직: `stt_processor.py` & `llm_processor.py`
*   `stt_processor.py`: SQS 메시지에 담긴 S3 오디오 파일(`m4a`) URI를 받아 AWS Transcribe에 던지고, 작업이 완료되면 전체 원본 텍스트를 추출해서 반환합니다. (URI 접두사 누락 시 자동 보정 로직 내장)
*   `llm_processor.py`: STT 텍스트를 입력받아 프롬프트 엔지니어링을 거쳐 다음 두 가지를 완수합니다. (Claude 3.5 Sonnet 활용)
    1.  전체 5~7줄 요약 및 결정사항 추출
    2.  `assignee`, `task`, `due_date` 필드를 가진 담당자별 To-Do 배열을 완벽한 JSON 형식으로 추출.

#### 📡 백엔드 송신: `api_client.py`
*   `api_client.py`: AI 처리가 완료(`COMPLETED`)되거나 실패(`FAILED`)했을 때 TA(Core API) 서버로 HTTP POST 요청을 쏴서 DB에 결과가 적재되도록 만드는 우체부 역할입니다.

### 개발 및 테스트 가이드(로컬)
*   **STT 단위 테스트:** SQS 없이 임시 S3 오디오 URI만 `stt_processor.py`에 강제로 주입하여 텍스트가 잘 나오는지 테스트.
*   **LLM 단위 테스트:** 추출된 이전 회의록 더미 텍스트를 `llm_processor.py`에 강제로 주입하여 요약본과 JSON 파싱이 완벽하게 나오는지 테스트.

## ✅ 성공한 환경 설정 이력
### [2026-03-02] 가상환경 및 라이브러리 셋업 완료
- **작업 내용:** Python 3.12 기반 venv 구축 및 주요 라이브러리(boto3, python-dotenv, requests) 설치 성공.
- **핵심 명령어:** `sudo apt install python3.12-venv -y` (Ubuntu 전용 패키지 설치 필수)

### [2026-03-02] 시스템 도구(Git, AWS CLI) 설치 완료
- **Git 설치:** `sudo apt install git -y` 후 사용자 정보(name, email) 설정 완료.
- **AWS CLI 설치:** 공식 웹사이트의 리눅스용 `.zip` 패키지를 통해 v2 버전 설치 성공.
- **설치 유물 제거:** `rm -rf aws/ awscliv2.zip` 명령으로 설치용 임시 파일 정리 완료.

## ⚠️ 트러블슈팅 (Troubleshooting)
1. **[설정] 가상환경 활성화 문제**
   - **문제:** `python` 명령어를 찾을 수 없음.
   - **원인:** WSL/Ubuntu 환경에서는 `python3`가 기본 명칭임.
   - **해결:** `python3 -m venv venv`로 생성 후 `source venv/bin/activate`로 활성화.
2. **[보안] IAM 액세스 키 영구 노출 보안 위협 방어**
   - **문제:** 기존 IAM User Access Key를 GitHub Secrets에 영구 저장하는 방식은 피싱/탈취 시 회사 AWS 인프라 전체가 뚫리는 심각한 보안 리스크 존재.
   - **해결:** 최신 클라우드 보안 표준인 **OIDC(OpenID Connect)** 자격 증명 공급자 방식을 도입하여 영구적인 비밀번호 탈취 위험을 원천 차단함.
3. **[보안] 과도한 AWS 관리형 권한 부여 리스크 차단**
   - **문제:** 처음 배포 테스트 시 광범위한 `PowerUserAccess` 권한을 부여하여, 해킹 시 다른 파트 리소스까지 노출될 수 있는 보안 취약점 상태.
   - **해결:** 오직 `ai-minutes-sa` ECR 저장소 접근 및 파이프라인(STT/LLM) 구동에만 한정된 **최소 권한 원칙(Least Privilege) 인라인 정책**(`iam_policy_least_privilege.json`)을 재설계하여 Role에 부여 완료.
4. **[테스트] 타 파트 연동 지연으로 인한 개발 블로킹 둥파**
   - **문제:** 프론트 음성 업로드나 백엔드 서버가 나오기 전까지, 단독으로 STT/LLM 결과물 컨디션 확인 및 테스트가 불가능한 상황 발생.
   - **해결:** 과금 방지 및 외부 의존도를 0%로 끊어낸 단독 로컬 모의 테스트 스크립트(`local_test.py`)를 작성하여 AI 성능을 사전 검증 완료.
5. **[공통/배포] ECR 인증 토큰 조회 실패 (네트워크 경로 미확보)**
   - **문제:** GitHub Actions 통과 후 ECS 서비스 기동 시 `unable to pull secrets or registry auth` 발생하며 컨테이너 기기동 실패.
   - **원인:** 프라이빗 망 연결 혹은 ECR로 향하는 아웃바운드 라우팅(VPC/NAT 게이트웨이) 누락으로 인한 타임아웃 현상.
   - **해결:** ECS 태스크가 속한 서브넷의 아웃바운드 인터넷 연결 설정을 점검하여 네트워크 재조정 후 정상 배포 완료.
6. **[공통/배포] ALB 헬스체크 타임아웃 및 컨테이너 무한 재시작 (보안그룹 오류)**
   - **문제:** 배포 직후 Target Group 대상 상태가 `Unhealthy`로 표시되며 `Request timed out` 발생.
   - **원인:** ECS 태스크 보안그룹(SG) 인바운드 규칙에 라우터(ALB)로부터의 트래픽 허용 누락.
   - **해결:** ECS Task 전용 SG 방화벽 규칙을 신설하여 인바운드 소스를 ALB SG로 제한 오픈, 타겟 상태 `Healthy` 정상화 달성.
7. **[공통/배포] CloudWatch 로그 그룹 누락 런타임 에러**
   - **문제:** 배포 과정 중 `The specified log group does not exist` 에러 발생.
   - **원인:** Task Definition에서 `awslogs` 드라이버로 지정한 CloudWatch Logs 그룹 폴더가 AWS 콘솔 상에 사전 생성되지 않음.
8. **[공통/배포] DB 컬럼 길이 부족 (Varchar -> Text 마이그레이션)**
   - **문제:** Bedrock이 생성한 요약 텍스트 길이가 `varchar(255)`를 초과하여 백엔드 DB 저장 시점(API Webhook)에서 Data Truncation 에러 발생.
   - **조치:** `meetings.failure_reason` 및 요약 칼럼들의 데이터 타입을 용량 제한이 없는 `TEXT`로 Alter 쿼리를 적용(마이그레이션)하여 AI 대형 텍스트 저장 런타임 오류 방어.
9. **[공통/배포] 컨테이너 크래시 무한루프 (.env 포맷 오타)**
   - **문제:** 백엔드 도커 컨테이너가 기동 직후 `invalid env file: ... contains whitespaces` 에러를 뿜으며 즉시 종료됨.
   - **원인:** 환경변수 주입 시 `DATABASE_URL = ...` 처럼 등호 양옆에 공백이 포함된 휴먼 에러 확인.
   - **조치:** 도커 빌드/실행 환경변수 문법에 맞춰 공백을 제거(`DATABASE_URL=...`)하여 컨테이너 기동 안정화.
10. **[공통/배포] ECS Task Definition 내 로그 그룹 이름 불일치**
   - **문제:** 배포 성공 후에도 로그가 남지 않고 태스크가 `ResourceNotFoundException`으로 즉시 종료됨.
   - **원인:** Task Definition 파일의 `awslogs-group` 설정이 실제 AWS에 생성된 이름(`/ecs/meetus-sa-container`)과 다르게 기재됨.
   - **해결:** 실제 로그 저장소 이름과 정확히 1:1 매칭되도록 템플릿 파일 수정 후 재배포 완료.
11. **[보안/권한] iam:PassRole 권한 부족으로 인한 배포 실패**
   - **문제:** GitHub Actions에서 서비스 업데이트 시 `AccessDeniedException` 발생.
   - **원인:** GitHub Actions용 OIDC Role이 새로 만든 `MeetUs-SA-TaskRole`을 ECS에 전달할 권한이 없음.
   - **해결:** OIDC Role의 정책에 `iam:PassRole` 대상을 명시적으로 추가하여 해결.
12. **[공통/배포] GitHub Action 성공 후 반영 지연 및 롤링 업데이트 정체**
   - **문제:** 깃허브 액션은 성공으로 뜨는데 AWS ECS에는 예전 태스크가 여전히 돌고 있고 새 버전이 반영되지 않음.
   - **원인:** ECS 롤링 업데이트는 `minimumHealthyPercent`(보통 100%) 규정에 따라 새 컨테이너가 완벽히 'Healthy' 상태가 되어야 옛날 것을 죽임. 만약 새 버전이 환경 설정(로그 그룹 등) 문제로 뜨지 못하면 계속 옛날 버전에 머물게 됨.
   - **해결:** 
     - 1) 워크플로우에 `aws ecs wait services-stable`을 추가하여 배포 완료 여부를 깃허브에서 끝까지 감시하도록 개선.
     - 2) **[실전 팁]** 배포가 꼬였을 경우, 사용자가 **직접 기존 태스크를 모두 '중지(Stop)'**시키면 ECS가 강제로 최신 태스크 정의를 물고 새 컨테이너를 즉시 기동하게 되어 정체 현상을 가장 빠르게 해결할 수 있음.
13. **[공통/환경] 모듈 참조 경로 오류 (Internal Module Import Error)**
   - **문제:** 터미널에서 `sqs_listener.py` 실행 시 `ModuleNotFoundError: No module named 'src'` 발생.
   - **원인:** 파이썬 실행 시 현재 디렉토리가 `sys.path`에 포함되지 않아 발생하는 경로 인식 문제.
   - **해결:** 모든 메인 스크립트 상단에 `sys.path.append` 로직을 수동 추가하여 실행 위치에 상관없이 모듈을 찾도록 보정.
14. **[설계/운영] 컨테이너 이름 일관성 유지 (Integration Drift)**
   - **문제:** 태스크 정의의 컨테이너 이름을 리포지토리명(`ai-minutes-sa`)과 맞추려다 기존 설정과 충돌 발생.
   - **원인:** 백엔드(TA) 및 기존 인프라가 `meetus-sa-container`라는 이름을 기반으로 세팅되어 있었음.
   - **해결:** 인프라 파츠 간의 약속된 컨벤션(`meetus-sa-container`)으로 이름을 원복하여 연동 무결성 확보.
15. **[공통/보안] Identity Hijack (정적 키 vs IAM Role 충돌)**
    - **문제:** ECS Task Role을 설정했음에도 불구하고, 엔진이 선영님 S3 버킷 접근 시 `AccessDenied` 발생.
    - **원인:** 로컬 테스트 시 사용하던 `.env` 파일의 `AWS_ACCESS_KEY_ID`가 도커 환경변수나 시스템 변수에 남아있어, Boto3가 Task Role보다 정적 키를 우선시하여 '허락받지 않은 신분(User)'으로 접근하려 함.
    - **해결:** `.env` 및 배포 설정에서 모든 정적 키를 제거하고, `sts get-caller-identity` 로그를 통해 신분이 `assumed-role/MeetUs-SA-TaskRole`임을 최종 확인하여 해결.
16. **[STT/보안] Transcribe 최종 연동 해결 (코드-권한 3단 합체)**
    - **문제**: Transcribe Job이 계속 `BadRequest` 또는 `AccessDenied`로 실패함.
    - **원인**: 단순히 권한만 준다고 되는 것이 아니라, **코드 상의 호출 옵션**과 **인프라 권한**이 1:1로 맞물려야 했음.
        - 1) 기초 권한: `MeetUs-SA-TaskRole`에 `transcribe:*` 액션 자체가 누락됨.
        - 2) 신뢰 관계: Role의 Trust Policy에 `transcribe.amazonaws.com` 서비스 추가 필요.
        - 3) 코드: `DataAccessRoleArn` 옵션 누락 시 타 계정 S3 접근 불가.
        - 4) IAM: `iam:PassRole` 권한 누락 시 코드의 `DataAccessRoleArn` 사용 불가.
        - 5) S3: `s3:GetBucketLocation` 누락 시 서비스 수준에서 버킷 위치 파악 불가.
    - **해결**: 
        - [IAM] 정책에 `transcribe:StartTranscriptionJob`, `transcribe:GetTranscriptionJob` 추가.
        - [Trust] Role 신뢰 관계 편집기에서 `transcribe.amazonaws.com` 서비스 신뢰 주체 추가.
        - [코드] `stt_processor.py`에 `JobExecutionSettings`와 `DataAccessRoleArn` 로직을 정확히 구현.
        - [IAM] `MeetUs-SA-TaskRole`에 스스로에 대한 `iam:PassRole` 허용.
        - [S3] 타 계정 버킷 정책에 `s3:GetBucketLocation` 명시적 허가.
    - **통찰**: '명령어(Code)'와 '허가증(Permission)'이 동시에 준비되어야만 작동하는 AWS 네이티브 서비스의 특성을 완벽히 정복함.
17. **[배포] CI/CD 브랜치 불일치로 인한 배포 미반영 (Sync Drift)**
    - **문제**: 깃허브에 코드를 푸시하고 로그에 성공이 뜨는데, 실제 ECS 로그에는 수정 전 코드가 계속 돌아가고 있음.
    - **원인**: `deploy-sa.yml` 워크플로우가 `main` 브랜치 푸시 시에만 작동하도록 설정되어 있었으나, 주환님은 `feat/juhn-sa` 브랜치에서 작업 중이었음. (액션이 아예 트리거되지 않음)
    - **해결**: 작업 브랜치를 `main`으로 머지(Merge)하여 배포 자동화를 정상 가동시키고, ECS 태스크 버전이 최신(v12 이상)으로 올라간 것을 확인하여 해결.
18. **[CI/CD] GitHub Actions의 '거짓 성공' 트랩 (Asynchronous Update)**
    - **문제**: GitHub Actions 워크플로우는 초록색 체크표시(Success)인데, 실제 AWS 서버는 구버전이 돌고 있음.
    - **고생한 기록**: 10번 넘게 푸시하며 "왜 액션은 성공인데 서버는 그대로지?"라며 멘붕에 빠짐.
    - **깨달음**: `aws ecs update-service` 명령은 '명령 전달'만 성공하면 즉시 종료됨. 실제 배포는 그 후 AWS 내부에서 천천히 일어나며, 이 과정에서 오류가 나면 ECS가 조용히 롤백(Rollback)해버림.
    - **진화**: 워크플로우에 `wait-for-service-stability: true` 옵션을 추가하여, 실제 배포가 완전히 끝날 때까지 GitHub Actions가 기다리도록 개선함.
19. **[ECS] 태스크 무한 종료 및 롤백 (The Resource Ghost)**
    - **문제**: 분명 소스코드는 완벽한데, ECS 태스크가 켜지자마자 `ResourceNotFoundException`을 뱉으며 1초 만에 죽어버림.
    - **고생한 기록**: 태스크 정의를 8번에서 12번까지 계속 새로 만들어도 소용없었음.
    - **진범**: **CloudWatch Log Group**. 설정 파일(JSON)에는 로그를 남길 주소(`/ecs/meetus-sa-container`)가 적혀 있었지만, 실제 AWS 서비스 상에 그 '방(Group)'이 생성되어 있지 않았음.
    - **해결**: 직접 AWS 콘솔에서 로그 그룹을 생성한 후, **[새 배포 강제]**를 통해 꼬여있던 롤백 루프를 끊어냄.
20. **[성장 통찰] 단순히 "할 줄 안다"를 넘어선 "헤쳐나가는 힘"**
    - 이번 프로젝트를 통해 배운 가장 큰 교훈은 **"클라우드 인프라는 선언(JSON)과 실체(Resource)가 일치해야 한다"**는 점입니다. 
    - 깃허브 액션의 초록불 뒤에 숨겨진 ECS의 고군분투를 이해하게 되었고, 오류 로그 한 줄(`ResourceNotFound`)이 단순히 서버가 안 된다는 뜻이 아니라 '어떤 부품이 빠졌는지'를 알려주는 이정표임을 깨닫게 된 뜻깊은 과정이었습니다.

## 🛠️ 향후 작업 예정 로직 (Draft)
- SQS 리스너 구현 시 `WaitTimeSeconds=20` 설정을 통해 비용 최적화(Long Polling) 적용 예정.
- 클라우드워치(CloudWatch) 등 배포 이후 인프라 연동 에러 핸들링 고도화 모니터링 적용 검토.

---

## ☁️ AWS 인프라 리소스 생성 및 설정 이력 (Infrastructure Track Record)
본 프로젝트 진행 과정에서 SA 파트(주환님)가 직접 설계하고 AWS 콘솔 및 CLI를 통해 구축 완료한 클라우드 인프라 자산 목록입니다. 향후 프로젝트 발표 및 포트폴리오 산출물 작성 시 핵심 기술 스택으로 활용될 수 있도록 상세히 기술합니다.

### 1️⃣ [보안 및 권한 제어] AWS IAM & OIDC (OpenID Connect) 연동
기존의 Access Key를 발급받아 GitHub Secrets에 하드코딩하는 방식은 탈취 시 막대한 보안 사고(과금 폭탄 및 데이터 유출)를 유발할 수 있는 레거시 안티패턴이었습니다.
- **OIDC Identity Provider (자격 증명 공급자) 도입:** GitHub Actions 자체를 신뢰할 수 있는 인증 기관으로 AWS에 등록하여, 배포 파이프라인이 도는 단 몇 분 동안만 유효한 임시 토큰(STS)을 발급받는 선진 클라우드 인증 체계(Keyless Authentication)를 선도적으로 구축하였습니다.
- **최소 권한의 원칙 (Least Privilege) 설계:** `PowerUserAccess`와 같은 광범위하고 위험한 AWS 관리형 정책을 전면 폐기하고, 오직 SA 엔진 구동 및 배포에만 필요한 권한(S3 읽기, SQS 수신/삭제, ECR 이미지 업로드)만을 담은 인라인 커스텀 정책(`iam_policy_least_privilege.json`)을 직접 설계 및 부여하여 해킹 피해의 Blast Radius(영향 반경)를 최소화했습니다.

### 2️⃣ [컨테이너 환경] AWS ECR (Elastic Container Registry) 구축
- **프라이빗 리포지토리 구성:** SA 파트 전용 AI 엔진 도커 이미지를 보관하기 위한 `ai-minutes-sa` 저장소를 구축했습니다.
- **CI/CD 파이프라인 연계:** `.github/workflows/deploy-sa.yml` 파일 작성으로 코드가 `main` 브랜치에 병합(Merge)되는 즉시, OIDC 인증을 거쳐 자동으로 도커 빌드 및 ECR 푸시가 일어나는 무중단 자동화 사이클을 완성했습니다. 컴파일 측면에서는 `.dockerignore`를 활용해 불필요한 패키지를 걷어내어 이미지의 경량화와 빌드 속도를 확보했습니다.

### 3️⃣ [서버리스 아키텍처] EKS 백지화 및 AWS ECS (Fargate) 전면 도입 (★ 핵심 의사결정)
- **오버엔지니어링(Over-engineering) 해소:** 당초 설계된 무거운 쿠버네티스(EKS) 인프라 구성은 현재 팀 단위의 마이크로서비스(MSA) 규모 대비 학습 곡선이 높고 인프라 유지 관리 오버헤드가 크다고 판단했습니다.
- **비용 최적화 및 운영 효율성 극대화:** 서버(EC2) 인스턴스를 직접 관리할 필요 없이, 도커 컨테이너를 올리기만 하면 CPU/Memory 리소스 단위로 과금되며 즉시 실행 가능한 서버리스 컨테이너 서비스인 **AWS ECS (Fargate)**로 아키텍처 방향성을 전면 수정하고 전사 문서를 100% 통합해냈습니다. `Desired Count`를 통해 1초 만에 0으로 낮추어 비용을 방어하거나 유연하게 스케일 아웃할 수 있는 유연성을 확보했습니다.
- **AWS 네이티브 배포 사이클 완전 통제:** ECR에 푸시된 도커 이미지를 바탕으로 [태스크 정의(Task Definition) 생성 -> 클러스터 매니징 -> 서비스(Service) 프로비저닝 -> 퍼블릭 IP 및 CloudWatch 할당]에 이르는 컨테이너 구동 A to Z를 AWS 콘솔 상에서 직접 수동 배포 및 트러블슈팅하며 인프라 구축 역량을 입증했습니다.

### 4️⃣ [비동기 메시징 & 타 계정 통신] AWS SQS & Cross-Account (★ 핵심 트러블슈팅)
- **비동기 롱 폴링(Long Polling) 설계:** AI 모델(Transcribe, Bedrock)의 처리는 수 분이 걸리므로, API 타임아웃(HTTP 504) 방지를 위해 백엔드와 SA 엔진 사이에 AWS SQS(`meetus-process-queue`) 브로커를 두는 비동기 아키텍처를 적용했습니다.
- **크로스 계정(Cross-Account) 권한 문제 해결:** TA(단비님) 파트 소유의 계정(6926...)에 위치한 SQS 큐를 우리 SA 계정(8184...)에서 접근하려다 발생한 `AccessDenied` 에러의 본질을 정확히 간파했습니다. IAM Role 검토에 그치지 않고, TA 측에 필요한 'SQS Resource-Based Policy (리소스 기반 액세스 정책)' JSON 템플릿을 직접 제공하여 교차 계정 보안 방화벽 문제를 주도적으로 뚫어냈습니다.

### 5️⃣ [AI 비즈니스 로직] AWS Transcribe & Amazon Bedrock (Claude 3.5 Sonnet)
- **All-AWS 에코시스템 고집:** 외부 API(OpenAI 등)를 사용할 경우 발생할 수 있는 데이터 유출 보안 리스크와 토큰 관리의 복잡성을 제거하기 위해, 오디오 전처리부터 최종 텍스트 추출까지 모든 과정을 AWS 내부망 Managed Service로 통일했습니다. 
- **STT (Speech-to-Text):** `AWS Transcribe`를 호출하여 S3에 저장된 회의 음성(.m4a)을 화자 분리(Diarization) 없이 빠르고 평이하게 텍스트로 치환해냅니다. S3 URI가 불완전할 경우(접두사 누락 등) 자동으로 `s3://`를 보정하는 안정화 로직이 포함되었습니다.
- **LLM (Large Language Model):** 추출된 원시 텍스트(Raw Text)를 **`Amazon Bedrock (Claude 3.5 Sonnet)`** 모델에 주입하여 프롬프트 엔지니어링을 수행합니다. "요약, 결정사항, 그리고 `assignee`, `task`, `due_date` 포맷의 To-Do 배열"을 무조건 JSON 형태로만 뱉어내도록 모델 통제력을 극대화했습니다.

### 6️⃣ [배포 전략] ECS Rolling Update vs Blue/Green (★ 전략적 선택)
본 프로젝트의 SA 엔진은 다음의 기술적 근거를 바탕으로 **ECS 롤링 업데이트** 방식을 채택하였습니다.
- **비통기 Worker 아키텍처:** SA 엔진은 사용자와 직접 통신하는 대신 SQS 대기열을 감시하는 '일꾼'입니다. 배포 중 단기 공백이 발생하더라도 메시지는 SQS에 안전하게 보관되므로 데이터 유실 리스크가 0%입니다.
- **ALB-Less 구조:** 외부 인바운드 트래픽이 없는 구조적 특성상, Blue/Green 배포를 위해 불필요하게 로드 밸런서(ALB)를 추가하여 인프라 비용과 복잡도를 높이는 대신, 현 구조에 최적화된 가장 가볍고 강력한 배포 방식을 선택했습니다.
- **환경 변수 및 IAM Role 통합:** `latest` 태그와 `taskRoleArn`을 활용하여 배포 즉시 최신 보안 설정과 기능이 반영되도록 설계했습니다.

### 7️⃣ [STT 기술 세부 명세] AWS Transcribe 연동 상세 (TRANSCRIBE_TECH_SPEC)
`STTProcessor` 클래스는 AWS SDK(Boto3)를 사용하여 Transcribe 서비스와 통신하며, 단일 책임 원칙(Single Responsibility)을 준수하도록 설계되었습니다.

#### 핵심 속성
- **Client**: `boto3.client('transcribe')`
- **DataAccessRoleArn**: 크로스 계정 S3 접근의 '열쇠'입니다.

> [!IMPORTANT]
> **성공의 핵심 (The Alignment)**: 단순히 권한만 주는 것이 아니라, **코드(DataAccessRoleArn)** + **IAM(PassRole)** + **S3(Location)** 권한이 동시에 정렬되어야만 작동합니다.

#### 상세 처리 프로세스
1. **Transcription Job 생성**: 매 호출마다 `ai_minutes_job_{uuid}` 고유 ID를 생성. `MediaFormat: m4a`, `LanguageCode: ko-KR` 고정.
2. **크로스 계정 보안 설정**: `DataAccessRoleArn`이 설정되어 있으면 `JobExecutionSettings`에 자동 포함. 이때 `iam:PassRole` 권한 필수.
3. **상태 모니터링 (Polling)**: 5초 간격으로 `get_transcription_job` 호출하여 `COMPLETED`/`FAILED` 확인.
4. **결과 데이터 파싱**: 결과물은 S3 임시 URL에 JSON으로 저장. `urllib.request`로 경량 다운로드하여 `data['results']['transcripts'][0]['transcript']` 추출.

#### STT 주요 설정값 요약
| 설정 항목 | 값 | 설명 |
| :--- | :--- | :--- |
| 리전 | `ap-northeast-2` | 서울 리전 고정 |
| 언어 | `ko-KR` | 한국어 분석 모드 |
| 파일 형식 | `m4a` | MPEG-4 오디오 지원 |
| 폴링 주기 | `5 seconds` | 실시간성 확보를 위한 주기 |

---

## 🔄 문서 변경 이력 (Audit Trail)

### ➕ [추가: ADDITION]
- **일시:** 2026-03-02
- **대상 파일:** `ai-pipeline/docs/SA-PLAYBOOK.md`
- **상세 내용:** 시스템 레벨의 필수 도구인 Git과 AWS CLI v2의 설치 성공 이력 기록.
- **추가 이유:** 사용자 환경 재구축 시 필요한 시스템 레벨의 의존성 도구들을 명세화하여 재현성을 확보하기 위함.

### 🔄 [변경/수정: MODIFICATION]
- **일시:** 2026-03-02
- **변경 위치:** 문서 전체 호칭 및 로그 섹션
- **변경 전:** 특정 개인 성함 사용 및 초기 작업 루틴 위주
- **변경 후:** 모든 호칭을 **'사용자'**로 통일하고, 기존 초안 내용을 100% 보존하며 누적 기록함.
- **수정 사유:** 문서의 전문성과 범용성을 높이기 위해 중립적 호칭 가이드라인을 적용함.

### 🔄 [변경/수정: MODIFICATION]
- **일시:** 2026-03-03
- **대상 파일:** `ai_context/project_current/LMS_RULES.md` -> `AWS_RULES.md` 및 `ai-pipeline/README.md`
- **상세 내용:** 프로젝트 문서 내에 남아있던 과거 'LMS 프로젝트(LMS_기능명세서.xlsx)' 호칭 및 관련 엑셀 명세서 참조 내용을 모두 삭제하고, 현재 요구사항에 맞춰 'AWS'로 파일명 및 내용을 전부 교체함.

### ➕ [추가: ADDITION]
- **일시:** 2026-03-05
- **대상 파일:** `ai-pipeline/src/core/stt_processor.py`, `ai-pipeline/src/network/api_client.py`, `ai-pipeline/src/sqs_listener.py`
- **상세 내용:** 
  1. AWS Transcribe를 호출하고 결과를 가져오는 STT 코어 모듈 작성 (m4a, ko-KR 기준).
   2. Core API(FastAPI)와 통신하여 상태 업데이드 및 최종 결과(JSON)를 전송하는 우체부 API Client 구비.
   3. 전체 파이프라인(STT->LLM->API_CLIENT)을 통합하여 24시간 롱 폴링(Long Polling)으로 큐를 감시하는 메인 컨트롤러 SQS Listener 조립 완료.
   4. [상세 명세] [AWS Transcribe 기술 세부 명세](file:///home/ubuntu/workspace/AI-Minutes/ai-pipeline/docs/TRANSCRIBE_TECH_SPEC.md)를 작성하여 STT 처리 전 과정을 문서화함.

### 🔄 [변경/수정: MODIFICATION]
- **일시:** 2026-03-05
- **변경 위치:** AI 파이프라인 전역 (`src/core/llm_processor.py`, `config.py`, `README.md`, `SA-Todo.md`, `ARCHITECTURE.md`)
- **변경 전:** LLM 요약 본체로 외부 API인 `OpenAI (GPT-4o)` 사용 및 `OPENAI_API_KEY` 환경변수 세팅 요구.
- **변경 후:** 외부 유출 보안 및 아키텍처 일관성(All AWS) 확보를 위해 `Amazon Bedrock (Claude 3.5 Sonnet)`으로 전면 마이그레이션 적용 및 `openai` 라이브러리/키 완전 제거.
- **수정 사유:** 비즈니스 요구사항(AWS 내부 보안 처리)을 충족하면서 비용 및 설정 복잡도를 최적화하기 위함.

### 🔄 [변경/수정: MODIFICATION]
- **일시:** 2026-03-05
- **변경 위치:** `src/network/api_client.py` 내부 `submit_ai_result` 함수
- **변경 전:** `POST /meetings/{meetingId}/result` 전송 및 payload 내 `transcript_text` 필드명 사용
- **변경 후:** `POST /internal/ai/result` 전송 및 payload 최상단 `meeting_id` 포함, `transcript` 필드명 사용 변경
- **수정 사유:** TA(단비님)가 최근 업데이트한 Backend API 명세서(`TA/api-spec.md`)의 Internal Webhook 통신 규격에 맞춰 엔진의 전송 스펙을 최신화(Sync)함.

### 🔄 [변경/수정: MODIFICATION]
- **일시:** 2026-03-05
- **변경 위치:** `ai-pipeline/docs/FEATURES.md` 및 `ai_context/project_current/AWS_RULES.md`
- **변경 전:** 회의록 진행 상태를 `UPLOADED` -> `PROCESSING` -> `COMPLETED` 3단계로 약식 설계.
- **변경 후:** 마스터 명세서(v1.0)의 전역 규격에 맞춰 `CREATED` -> `UPLOADED` -> `PROCESSING` -> `COMPLETED` -> `FAILED` 5단계 공식 상태 머신 적용.
- **수정 사유:** 전사 시스템 간 데이터 무결성 확보와 상태 추적의 정밀도를 마스터 명세서와 100% 동기화하기 위함.

### ➕ [추가: ADDITION]
- **일시:** 2026-03-11
- **대상 파일:** `ai-pipeline/src/config.py`, `ai-pipeline/.env`, `ai-pipeline/src/network/api_client.py`, `ai-pipeline/src/sqs_listener.py`
- **상세 내용:** 
  1. TA 파트(단비님)의 실제 운영 서버(ALB) 주소 획득 및 `CORE_API_URL` 적용 완료
  2. 에러 핸들링 및 무한 무응답 방지를 위해 `POST /internal/ai/failed` (FAILED 상태 및 `reason` 수신용) 웹훅을 개발하여 파이프라인 예외 처리(Try-Catch) 구문에 이식 완료
  3. LLM 데이터의 `due_date` 날짜 포맷(`YYYY-MM-DD` 문자열) TA 연동 스펙과 교차 검증 및 호환 확인
  4. SQS Cross-Account 원인 규명 및 단비님께 권한 허가 요청(Policy JSON 템플릿 제공) 조치 완료

### ➕ [추가: ADDITION]
- **일시:** 2026-03-06 ~ 2026-03-09
- **대상 파일:** `ai-pipeline/src/local_test.py`, `ai-pipeline/Dockerfile`, `ai-pipeline/.dockerignore`, `.github/workflows/deploy-sa.yml`
- **상세 내용:** 
  1. 가짜(Mock) S3 URI 및 가상의 녹음 텍스트를 활용하여 물리적인 STT 처리 없이 로직의 흐름을 빠르게 검증할 수 있는 `local_test.py` 스크립트 작성 (완료)
  2. Bedrock 요약이 규격(JSON)에 맞게 잘 반환되는지 성공적으로 검증
  3. 안정성과 경량화를 고려한 `python:3.12-slim` 기반의 AWS ECS(Fargate) 배포용 `Dockerfile` 생성 완료.
  4. 도커 이미지 최적화 및 보안 강화를 위한 `.dockerignore` 추가, 프론트/백엔드와 독립적으로 동작(MSA)하는 AWS ECR 자동 배포 CI/CD 파이프라인(`deploy-sa.yml`) 연동 완료.
  - `SA-PLAYBOOK.md` 업데이트 완료
  - AWS IAM 정책 적용 완료: `PowerUser` 등의 광범위한 권한 대신, 리소스를 제한하는 Custom IAM Role 정책(Inline) 적용하여 보안성 대폭 강화 완료 (`iam_policy_least_privilege.json`)
  - **[보안 고도화]** `deploy-sa.yml`의 IAM 영구 Access Key 인증 방식을 **단기 자격 증명(OIDC Role Assuming)** 방식으로 업그레이드 완료 (GitHub Secrets `SA_AWS_ROLE_TO_ASSUME` 사용). 인라인 정책을 적용하여, 오직 `ai-minutes-sa` ECR 저장소에만 접근할 수 있도록 보안(최소 권한의 원칙)을 강화함. AWS CLI를 통해 ECR 저장소 생성을 완료함.

### ➕ [추가: ADDITION]
- **일시:** 2026-03-11
- **대상 파일:** `ai-pipeline/docs/SA-PLAYBOOK.md`, `SA/README.md`
- **상세 내용:** 
  1. (삭제) 기존 작성되었던 ECS IAM Role 에러 기재 내역 삭제 (권한 누락 딜레이 후 자연해결되어 문서에서 제거).
  2. (추가 통합) 타 부서(프론트/백엔드)의 트러블슈팅 문헌(`aws-deploy-evidence`)을 조사하여 공통으로 겪고 있는 `GitHub Actions/AWS ECS` 병목 경험 발췌 및 플레이북에 통합.
     - 주요 삽입 항목: ECR 네트워크 권한 타임아웃 조치, CloudWatch Log Group 미생성 예외 처리, ALB 헬스체크와 보안그룹(Security Group) 인바운드 방화벽 펀칭 등.
  3. (추가 완료) 전체 통합 파이프라인에서 누락되었던 **DB 마이그레이션(TEXT 타입 변경) 이슈** 및 백엔드 측의 **.env 파일 포맷(공백) 오류 크래시 장애 극복 과정**을 트러블슈팅 8, 9번 항목으로 추가.
  4. 주환님의 ECS 생애 첫 수동 프로비저닝(클러스터 생성, 태스크 연동, 서비스 구동) 과정 성공 이력을 '인프라 트랙 레코드' 섹션에 문서화 달성.