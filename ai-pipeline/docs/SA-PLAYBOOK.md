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
- **문제:** `python` 명령어를 찾을 수 없음.
- **원인:** WSL/Ubuntu 환경에서는 `python3`가 기본 명칭임.
- **해결:** `python3 -m venv venv`로 생성 후 `source venv/bin/activate`로 활성화.

## 🛠️ 향후 작업 예정 로직 (Draft)
- SQS 리스너 구현 시 `WaitTimeSeconds=20` 설정을 통해 비용 최적화(Long Polling) 적용 예정.

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
- **변경 전:** 회의록 진행 상태를 `TRANSCRIBING` -> `SUMMARIZING` -> `TODO_EXTRACTING` 등의 5단계로 세분화.
- **변경 후:** Backend API 명세서(api-spec.md)의 단순화된 전이 규격에 맞춰 `TRANSCRIBING` -> `PROCESSING` -> `COMPLETED` 3단계로 통합 및 덮어쓰기 적용.
- **수정 사유:** 파이프라인의 내부 세세한 상태(STT/LLM 전이)보다, 프론트엔드와 코어 API 간의 직관적인 공통 상태값 규격(PROCESSING)을 따르기 위함.