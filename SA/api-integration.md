# SA API Integration (연동 규격 정의서)

## 1. 개요
본 문서는 단비님(TA 파트)이 구축한 Core API 및 프론트엔드와 통신하기 위해, SA 파트(주환 파이썬 엔진)가 받아들이거나 보내는 **인터페이스 입력/출력 데이터 규격**을 정리합니다.

## 2. 수신 (Input): SQS 메시지 큐
- 파츠 간 타이밍 교착(Deadlock) 및 HTTP 타임아웃 504를 막기 위한 비동기 브로커입니다.
- TA 서버가 SQS로 아래와 같은 규격의 알림을 보내줍니다.

### 2.1 SQS Payload Example
```json
{
  "meeting_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  "audio_s3_key": "meetings/a1b2c3d4/audio.m4a"
}
```

## 3. 중간 발송 알림: 회의 분석 상태 업데이트
- **(변경)**: Master Spec v1.0에 따라, 회의 상태를 `PROCESSING`으로 변경하는 주체는 백엔드(Core API)가 SQS로 메시지를 던지는 시점에 수행합니다.
- 따라서 SA 엔진은 별도의 상태 업데이트 API 호출 없이 즉시 처리에 들어갑니다.

## 4. 최종 결과 적재: Core API Webhook 호출
- AI 분석이 성공적으로 완료되면 SA 엔진이 Core API의 웹훅(`POST /internal/ai/result`)을 호출하여 최종 결과 데이터(JSON)를 전송합니다. 
- 통신 대상(Base URL)은 백엔드의 실 배포 주소인 `http://meetus-alb-858165370.ap-northeast-2.elb.amazonaws.com` 을 사용합니다.

### 4.1 발송 데이터 매핑
1. **`transcripts`**: `full_text` 필드에 STT 원본 텍스트 전달.
2. **`summaries`**: 요약 및 결정사항 전달.
3. **`todos`**: 추출된 담당자(`assignee`)와 할 일(`task`), 기한(`due_date`) 배열 형태 전달.
4. **`meetings`**: 결과 발송이 성공하면 Core API가 DB에 데이터를 적재하고 상태를 `COMPLETED`로 변경합니다. (SA 엔진이 직접 상태를 변경하지 않음)

### 4.2 최종 데이터 구조 (JSON)
- LLM(Bedrock)으로부터 받는 내부 규격은 동일합니다.
- `todos` 배열 내의 기한은 `due_date` 필드명에 `YYYY-MM-DD` 문자열 포맷으로 전달됩니다.

## 5. 치명적 예외 처리 (FAILED 웹훅)
- SQS에서 메시지를 받아 파이프라인 처리를 하던 중 STT 변환 실패, 타임아웃, 포맷 에러 등의 치명적 예외(Exception)가 발생할 경우, SA 엔진은 즉시 `POST /internal/ai/failed` 웹훅을 호출합니다.
- **Payload 예시**: `{"meeting_id": "req-uuid", "reason": "STT Timeout Exception"}`
- 이를 수신한 TA 서버는 DB의 회의 상태를 `FAILED`로 갱신하고 `reason`을 저장하여 무한 로딩 표류 현상을 방지합니다.

## 6. 핵심 통신 규약
* **Timeout 정책:** 백엔드 발송 시 모든 요청은 `timeout=10` 제한을 가집니다. 발송 장애 시 즉시 에러가 떨어지며 SQS 메시지 재처리(Retry) 루프를 타게 됩니다.
* **Header 토큰:** 추후 TA쪽에서 방화벽(Auth) 설정을 걸 경우, `.env`에 정의된 `INTERNAL_AUTH_TOKEN`을 Header `Authorization` 에 실어서 전달하도록 확장 설계되어 있습니다.
