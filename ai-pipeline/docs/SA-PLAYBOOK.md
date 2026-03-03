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
- **작업 내용:** Python 3.12 기반 venv 구축 및 주요 라이브러리 4종(boto3, openai, python-dotenv, requests) 설치 성공.
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