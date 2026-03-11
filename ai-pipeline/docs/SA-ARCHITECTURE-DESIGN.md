# 🧠 SA(AI 엔진) 내부 아키텍처 및 모듈 설계도

본 문서는 `ai-pipeline/src` 내부의 파이썬 코드가 어떤 구조로 역할을 분담하고 있는지 명시합니다. SA 담당자(주환)가 AI 파이프라인 개발을 모듈러(Modular) 방식으로 관리하기 위해 작성되었습니다.

---

## 1. 디렉토리 구조 (Directory Layout)
AI 로직은 유지보수와 단위 테스트(Unit Test)의 용이성을 위해 단일 스크립트가 아닌, 철저히 분리된 역할 단위로 구성됩니다.

```text
ai-pipeline/
├── .env                  # (Git 제외) AWS 연동 핵심 보안 키 
├── docs/                 # 기획, 아키텍처, 기능 명세 및 플레이북 가이드
└── src/                  # 파이썬 메인 소스코드 디렉토리
    ├── config.py         # 1. 중앙 환경 변수 로드 및 통제소
    ├── sqs_listener.py   # 2. 메시지 수신 및 전체 파이프라인(Main) 컨트롤러 
    ├── core/             # 3. AI 변환 코어 비즈니스 로직
    │   ├── stt_processor.py # 음성 -> 텍스트 변환 (AWS Transcribe)
    │   └── llm_processor.py # 텍스트 -> 요약/할일 JSON 변환 (Amazon Bedrock)
    └── network/          # 4. 외부 통신 로직
        └── api_client.py    # 결과물 DB 적재를 위한 Core API 서버 통신
```

## 2. 모듈별 세부 역할 및 Flow

### ⚙️ 시스템 컨트롤: `src/config.py` & `src/sqs_listener.py`
*   `config.py`: `.env` 파일을 로드하여 `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` 등을 파이썬 변수로 메모리에 올립니다. 모든 보안 키는 오직 여기서만 관리됩니다.
*   `sqs_listener.py`: 파이프라인의 심장입니다. AWS SQS를 24시간 롱 폴링(20초 대기)하다가 `UPLOADED` 이벤트 메시지가 오면 낚아채서 `stt` -> `llm` -> `api` 모듈들을 순서대로 지휘(Orchestrate)합니다. **(최대 3회 실패 시 FAILED 처리 로직 포함)**

### 🧠 코어 로직: `core/stt_processor.py` & `core/llm_processor.py`
*   `stt_processor.py`: SQS 메시지에 담긴 S3 오디오 파일(`m4a` 등) URI를 받아 AWS Transcribe에 던지고, 작업이 완료되면 전체 원본 텍스트를 추출해서 반환합니다.
*   `llm_processor.py`: STT 텍스트를 입력받아 프롬프트 엔지니어링을 거쳐 다음 두 가지를 완수합니다.
    1.  전체 5~7줄 요약 및 결정사항 추출
    2.  `assignee`, `task`, `due_date` 필드를 가진 담당자별 To-Do 배열을 완벽한 JSON 형식으로 추출.

### 📡 백엔드 송신: `network/api_client.py`
*   `api_client.py`: 중간 상태(`#PROCESSING`)가 변경되거나, 모든 AI 처리가 완료(`#COMPLETED`)되었을 때 TA(단비)님의 파이썬 Core 서버로 HTTP POST/PATCH 요청을 쏴서 DB에 결과가 적재되도록 만드는 우체부 역할입니다.

---

## 3. 개발 및 테스트 가이드(로컬)
개발 도중 SQS나 Core API 연동 없이도 **각 모듈을 개별적으로 테스트**할 수 있어야 설계가 잘 된 것입니다.

*   **STT 단위 테스트:** SQS 없이 임시 S3 오디오 URI만 `stt_processor.py`에 강제로 주입하여 텍스트가 잘 나오는지 테스트.
*   **LLM 단위 테스트:** 추출된 이전 회의록 더미 텍스트를 `llm_processor.py`에 강제로 주입하여 요약본과 JSON 파싱이 완벽하게 나오는지 테스트.
