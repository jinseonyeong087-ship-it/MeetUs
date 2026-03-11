# 🚀 SA (AI 파이프라인) 작업 WBS 및 To-Do List

**담당자:** 주환 (SA)
**목표:** AWS 내부망(All AWS) 아키텍처를 기반으로 SQS 메시지를 수신하여 음성을 텍스트로 변환(Transcribe)하고, Bedrock(Claude 3)을 통해 요약 및 To-Do를 추출하여 Core API 웹훅으로 전달한다.

## 🏃‍♂️ Phase 1: 개발 환경 및 클라우드 연동 세팅 (완료)
- [v] 파이썬 가상환경 세팅 및 필수 라이브러리 설치 (`boto3`, `requests`, `python-dotenv`)
- [v] 보안 및 의존성 최적화: 사용하지 않는 `openai` 라이브러리 완전 제거
- [v] AWS IAM 권한 설정 (S3, SQS, Transcribe, Bedrock 접근 권한 4대장 확인 완료)
- [v] `src/config.py`: 환경 변수(`.env`) 중앙 통제 모듈 구성 완료

## 📡 Phase 2: 코어 비즈니스 로직 (AI 엔진) 모듈화 (완료)
- [v] `src/core/stt_processor.py`: AWS Transcribe API 연동 (작업 시작, Polling 및 텍스트 반환)
- [v] `src/core/llm_processor.py`: Amazon Bedrock (Claude 3 Sonnet) 연동
  - *Point:* 지정된 JSON 형태(`assignee`, `task`, `due_date`)로만 응답받도록 마스터 프롬프트 작성
- [v] `src/network/api_client.py`: Core API에 최종 결과(summaries, todos)를 JSON으로 전송하는 모듈 구현 완료

## ⚙️ Phase 3: SQS 메인 컨트롤러 조립 (완료)
- [v] `src/sqs_listener.py`: SQS 20초 롱 폴링(Long Polling) 대기 및 메시지 수신 로직 구축
- [v] 전체 파이프라인(STT -> LLM -> API Client) 통합 조립 및 예외 처리(Try-Except)
- [v] 결과 데이터 웹훅 발송 (수신한 Core 백엔드가 상태 업데이트 수행)
- [v] 에러 Throw를 통한 3회 재처리(Retry) 및 DLQ 연계 스펙 반영

## 🏃‍♂️ Phase 4: 구조 독립성 검증 및 로컬 테스트 (대기 중)
- [v] `src/local_test.py`: 과금 및 외부 서버 의존성 없이 AI 로직만 검증할 모의(Mock) 리포팅 파일 껍데기 작성
- [v] TA 쪽 서버 주소(CORE_API_URL) 발급 대기 (발급 시 `.env` 등록 후 연동)
- [v] TA 쪽 `POST /internal/ai/result` 라우터와 통신 정상 응답 확인 (E2E)
- [v] TA 쪽 `FAILED` 라우터와 통신 정상 응답 로직 교차 적용 완료
- [v] 담당자 및 `due_date` JSON 포맷 교차 확인
- [v] TA 측 SAA 계정의 SQS 큐 URL(`SQS_QUEUE_URL`) 발급 및 `.env` 적용 및 테스트 완료

## 🚀 Phase 5: 인프라 배포 및 통합 연동 테스트 (예정)
- [v] (TA/AA 협의) S3 버킷 권한 및 정보 확보 완료 (`meetus-audio-storage`), SQS 큐 실제 주소(`meetus-process-queue`) 획득 및 `.env` 적용 완료
- [v] AWS ECS (Fargate) 컨테이너화를 위한 `Dockerfile` 작성 및 도커 이미지(ECR) 빌드 준비
- [v] 배포 최적화를 위한 `.dockerignore` 및 **(추가) OIDC 인증 및 CodeDeploy 기반 ECS 블루/그린** 배포 스크립트 고도화 완료
- [ ] 통합 E2E 테스트: 프론트엔드 실제 음성 업로드 -> 코어 API -> SQS -> AI 엔진 -> DB 결과 렌더링까지 전체 핑(Ping) 테스트
- [ ] 클라우드워치(CloudWatch) 로그 그룹 연동 및 컨테이너 에러 쓰레드 모니터링 구축