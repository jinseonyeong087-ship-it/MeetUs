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

## 🛠️ 향후 작업 예정 로직 (Draft)
- SQS 리스너 구현 시 `WaitTimeSeconds=20` 설정을 통해 비용 최적화(Long Polling) 적용 예정.
- 클라우드워치(CloudWatch) 등 배포 이후 인프라 연동 에러 핸들링 고도화 모니터링 적용 검토.

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