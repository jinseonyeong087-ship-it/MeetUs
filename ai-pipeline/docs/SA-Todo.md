# 🚀 SA (AI 파이프라인) 작업 WBS 및 To-Do List
**담당자:** 주환 (SA)
**목표:** AWS SQS 메시지를 수신하여 음성을 텍스트로 변환(STT)하고, LLM을 통해 요약 및 To-Do를 추출하여 Core API(DB)에 전달한다.

## 🏃‍♂️ Phase 1: 개발 환경 및 클라우드 연동 세팅
- [v] 파이썬 가상환경 세팅 및 필수 라이브러리 설치 (`boto3`, `openai`, `requests` 등)
- [v] AWS IAM 권한 설정 (S3 읽기, SQS 읽기/삭제, Transcribe 접근 권한)
- [v] 환경 변수(`.env`) 세팅 (AWS Access Key, OpenAI API Key 등 - **절대 GitHub에 올리지 말 것!**)

## 📡 Phase 2: SQS 통신 및 데이터베이스 연동
- [ ] AWS SQS 폴링(Polling) 리스너 구현 (새 메시지가 올 때까지 대기하고 낚아채기)
- [ ] SQS 메시지 파싱 및 검증 (수신된 JSON 데이터 구조 확인, 30MB/m4a 제약 체크)
- [ ] Core API / DB 통신을 위한 HTTP Request 모듈 구현
  - *Rule:* DB 컬럼명은 `snake_case`, FE/Java API 연동 데이터는 `camelCase` 엄수. PK는 `Long`(파이썬에서는 `int`) 타입 적용.
- [ ] DB 상태 업데이트 로직 구현 1: 작업 시작 시 `[TRANSCRIBING]`으로 상태 변경

## 🎙️ Phase 3: AWS Transcribe (STT) 파이프라인
- [ ] S3에 업로드된 오디오 파일 URI를 Transcribe Job으로 전송
- [ ] Transcribe 작업 완료 상태 추적 로직 구현 (완료될 때까지 대기)
- [ ] 변환 완료된 원본 텍스트(Transcript) 추출 및 정제
- [ ] DB 상태 업데이트 로직 구현 2: STT 완료 후 `[SUMMARIZING]`으로 상태 변경

## 🧠 Phase 4: OpenAI (LLM) 기반 요약 및 To-Do 추출
- [ ] 프롬프트 엔지니어링 1: 원본 텍스트 기반 핵심 회의록 요약(5~7줄 + 결정사항) 프롬프트 작성
- [ ] 프롬프트 엔지니어링 2: 요약본 기반 담당자별 To-Do List 추출 프롬프트 작성
  - *Point:* 반드시 정형화된 JSON 형태(`assignee`, `task`, `due_date`)로 응답받도록 LLM 파라미터(Response Format) 설정
- [ ] DB 상태 업데이트 로직 구현 3: 요약/추출 중 `[TODO_EXTRACTING]`으로 상태 변경

## 🏁 Phase 5: 최종 결과 적재 및 에러 핸들링
- [ ] 추출된 최종 데이터(요약 텍스트, To-Do JSON 리스트)를 Core API로 전달 (또는 DB 직접 적재)
- [ ] DB 상태 업데이트 로직 구현 4: 모든 작업 정상 종료 시 `[COMPLETED]` 상태로 변경
- [ ] 예외 처리(Try-Except) 및 에러 상태 로깅: 작업 실패 시 로깅 후 SQS 메시지 재처리 시도 (최대 3회)
- [ ] 데드레터 큐(DLQ) 및 상태 변경: 3회 실패 시 DB 상태를 `[FAILED]`로 최종 업데이트 및 메시지 파기