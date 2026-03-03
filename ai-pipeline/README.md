# 🤖 AI-Minutes: AI Processing Service (SA)

이 디렉토리는 회의 음성 데이터를 분석하여 텍스트로 변환(STT)하고, 핵심 요약 및 To-Do를 추출하는 **AI 파이프라인 엔진**의 소스코드를 포함합니다. [cite: User Summary]

## 🛠️ Tech Stack
- **Language:** Python 3.10+ [cite: User Summary]
- **Cloud:** AWS (S3, SQS, Transcribe) [cite: User Summary]
- **AI Model:** OpenAI GPT-4o [cite: User Summary]
- **Libraries:** Boto3, OpenAI-Python, Requests, Dotenv [cite: User Summary]

## 📂 Directory Structure
- `src/`: AI 파이프라인 핵심 로직 (SQS Listener, STT Worker, LLM Analyzer)
- `docs/`: SA 전용 작업 명세서 (`SA-Todo.md`) 및 기술 문서
- `.env`: 환경 변수 관리 (API Keys, AWS Credentials - **Git 제외**) [cite: User Summary]
- `requirements.txt`: 의존성 라이브러리 목록 [cite: User Summary]

## ⚙️ Key Features
1. **SQS Message Polling:** Core API로부터 발행된 작업 지시 메시지를 비동기로 수신 [cite: User Summary]
2. **AWS Transcribe Integration:** S3에 업로드된 오디오 파일을 고정밀 텍스트로 변환 [cite: User Summary]
3. **LLM Analysis:** 변환된 텍스트를 바탕으로 회의록 요약 및 정형화된 To-Do List 추출 [cite: User Summary]
4. **Status Feedback:** 작업 단계별 상태(`TRANSCRIBING`, `COMPLETED` 등)를 Core API에 실시간 업데이트 [cite: User Summary]

## 🚀 Getting Started
1. **가상환경 설정:**
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # Windows
   ```
2. **라이브러리 설치:**
   ```bash
   pip install -r requirements.txt
   ```
3. **환경 변수 세팅:** `.env` 파일을 생성하고 필요한 API Key들을 설정합니다. [cite: User Summary]

## ⚖️ Development Rules
- 모든 코드는 `ai_context/default/GUIDELINES.md`의 규칙을 최우선으로 준수한다. [cite: Saved Information]
- 데이터베이스 연동 및 API 통신 시 `AWS_RULES.md`에 정의된 네이밍 컨벤션(Snake/Camel Case)을 따른다. [cite: Saved Information]
- 작업 진행 상황은 `docs/SA-Todo.md`에 업데이트하여 팀원들과 공유한다. [cite: Saved Information]