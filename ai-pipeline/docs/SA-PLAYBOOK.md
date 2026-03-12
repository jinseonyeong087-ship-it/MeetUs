# 📖 SA 작업 플레이북 (SA-Playbook)
이 문서는 개발 환경 재구축 및 성공한 코드 로직을 복기하기 위한 기록입니다.

## 🚀 데일리 작업 시작 루틴 (WSL/Ubuntu 기준)
1. **프로젝트 폴더 이동:** `cd ~/workspace/AI-Minutes/ai-pipeline`
   - **작업툴 터미널:** `cd ai-pipeline`
2. **가상환경 활성화:** `source venv/bin/activate`
3. **의존성 확인 (필요 시):** `pip install -r requirements.txt`
4. **도구 작동 확인:** `git --version` 및 `aws --version` 체크

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
   - **문제:** GitHub Actions 통과 후 ECS 서비스 기동 시 `unable to pull secrets or registry auth` 발생하며 컨테이너 기동 실패.
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

### 5️⃣ [AI 비즈니스 로직] AWS Transcribe & Amazon Bedrock (Claude 3_Sonnet)
- **All-AWS 에코시스템 고집:** 외부 API(OpenAI 등)를 사용할 경우 발생할 수 있는 데이터 유출 보안 리스크와 토큰 관리의 복잡성을 제거하기 위해, 오디오 전처리부터 최종 텍스트 추출까지 모든 과정을 AWS 내부망 Managed Service로 통일했습니다. 
- **STT (Speech-to-Text):** `AWS Transcribe`를 호출하여 S3에 저장된 회의 음성(.m4a)을 화자 분리(Diarization) 없이 빠르고 평이하게 텍스트로 치환해냅니다.
- **LLM (Large Language Model):** 추출된 원시 텍스트(Raw Text)를 `Amazon Bedrock (Claude 3)` 모델에 주입하여 프롬프트 엔지니어링을 수행합니다. "요약, 결정사항, 그리고 `assignee`, `task`, `due_date` 포맷의 To-Do 배열"을 무조건 JSON 형태로만 뱉어내도록 모델 통제력을 극대화했습니다.

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

### 🔄 [변경/수정: MODIFICATION]
- **일시:** 2026-03-05
- **변경 위치:** AI 파이프라인 전역 (`src/core/llm_processor.py`, `config.py`, `README.md`, `SA-Todo.md`, `ARCHITECTURE.md`)
- **변경 전:** LLM 요약 본체로 외부 API인 `OpenAI (GPT-4o)` 사용 및 `OPENAI_API_KEY` 환경변수 세팅 요구.
- **변경 후:** 외부 유출 보안 및 아키텍처 일관성(All AWS) 확보를 위해 `Amazon Bedrock (Claude 3 Sonnet)`으로 전면 마이그레이션 적용 및 `openai` 라이브러리/키 완전 제거.
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