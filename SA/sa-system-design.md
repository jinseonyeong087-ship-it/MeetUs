# SA System Design (AI Pipeline)

## 1. 개요
본 문서는 AI 회의 요약 & 개인별 To-Do 아카이브 시스템 내에서, STT(음성 텍스트 변환) 및 LLM(회의 요약 및 할 일 추출)을 담당하는 **SA 엔진**의 구조와 동작 방식을 정의한다.

### 1.1 적용 범위
- 언어: Python 3.12 (가상환경 분리)
- 도커: `python:3.12-slim` 패키지(경량화)
- AWS 서비스: AWS SQS, AWS Transcribe, Amazon Bedrock (Claude 3_Sonnet), ECR & ECS (Fargate)

### 1.2 설계 원칙
- AI 모델 내부를 직접 구성하지 않고 AWS Managed Service의 API 연동 위주로 구축하여 유지보수성 극대화.
- STT, LLM과 같은 무거운 작업 중 스레드가 막히지 않도록(Non-blocking) 비동기 롱 폴링 위주로 설계.
- 배포 전략: ECS(Fargate) 기반의 Blue-Green 무중단 배포 적용.
- 데이터 적재: AI 결과의 무결성을 위해 백엔드 Core API 웹훅을 호출하여 JSON 결과를 전달(Webhook API 연동).
- 장애 대응: SQS 메시지 에러 시 자체 3회 재처리 후 자동 DLQ 연계 아키텍처 가정.

---

## 2. SA Architecture (AI Pipeline)

### 2.1 전체 구조
`SQS (Queue) -> sqs_listener (Main) -> stt_processor -> llm_processor -> api_client (Core API 전달)`

### 2.2 요청 흐름 (1-Cycle)
1. 프론트/백엔드에 의해 AWS SQS 대기열에 '새로운 음성이 업로드 됨' 이라는 JSON 메시지가 꽂힌다. (상태: `UPLOADED`)
2. `sqs_listener.py`는 24시간 백그라운드로 돌면서 20초 주기(Long Polling)로 메시지를 낚아챈다. (이 시점에 백엔드에서 이미 상태를 `PROCESSING`으로 변경 완료)
3. `stt_processor.py`가 AWS Transcribe에 음성 S3 주소를 넘겨 전체 자막(Text)을 받아온다.
4. 변환된 텍스트를 `llm_processor.py`가 Amazon Bedrock (Claude 3)으로 던져 특정 JSON 포맷(요약 및 To-Do)으로 리턴받는다.
5. `api_client.py`가 최종 취합된 로직(STT, 요약, To-Do JSON)을 백엔드 Core API의 웹훅으로 전송한다. (상태 변경 및 데이터 적재는 백엔드가 수행)
6. 에러 없이 5번이 끝나면 SQS에서 메시지를 안전하게 지운다(Ack).

---

## 3. SA 디렉토리 구조 (ai-pipeline 폴더 내부)

```text
ai-pipeline/
├── Dockerfile        # Docker 배포 이미지 
├── .dockerignore     # 불필요 파일 제외
├── requirements.txt  # Python 패키지 의존성 (boto3, requests)
├── src/
│   ├── config.py     # 모든 .env 환경변수를 중앙 제어하는 파일
│   ├── sqs_listener.py  # 메인 엔진 (24시간 모니터링 데몬)
│   ├── local_test.py    # 외부 과금 연동 없는 단위 테스트(Mock) 용 파일
│   ├── core/
│   │   ├── stt_processor.py  # AWS Transcribe 호출
│   │   └── llm_processor.py  # AWS Bedrock 호출 (Prompt Engineering)
│   ├── network/
│   │   └── api_client.py     # 백엔드 서버로 REST API 통신 발송 모듈
└── docs/             # 각종 설계 및 플레이북 백업
```

### 3.1 모듈 분리 기준
- `core/`: AI의 브레인 역할을 담당하는 AWS API 연동부만 모아두었다.
- `network/`: 타사(파트너)와 통신하는 프로토콜(HTTP Request)만 담당하여, 추후 서버 주소 변경 시 요 구간만 수정하게 유연성을 부여했다.

---

## 4. 예외 및 실패 처리 (Failover)
- **AWS API 임시 오류:** CloudWatch 로깅 후 무시하고 Exception을 던지면, 위쪽(부모) `sqs_listener`의 Try-Except 격벽에 막혀 메시지가 삭제되지 않음. 이후 SQS의 특성에 의해 잠시 후 큐에 다시 등장하여 자동으로 **재시도(Retry)** 가 이루어짐.
- **포맷 추출 실패:** Claude 3가 가끔 JSON 규격을 지키지 않을 때를 대비해 파서(`json.loads`) 에러를 뿜게 하여 위 재시도 매커니즘을 그대로 타게 구성함.
