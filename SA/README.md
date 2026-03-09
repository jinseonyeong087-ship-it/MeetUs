# SA (AI 파이프라인) 작업 증적 및 연동 요약

본 문서는 AI 시스템(SA 파트)의 작업 이력을 정리하고 전체 연동의 기준이 되는 증적 문서입니다. 음성 파일을 텍스트(STT)로 변환하고, Amazon Bedrock(Claude 3)을 통해 회의 요약 및 To-Do를 추출하는 일련의 비동기 백그라운드 파이프라인 구조를 가집니다.

## 1) 요건 만들기
- **목표:** 프론트엔드에서 S3에 업로드된 회의 음성 파일을 백그라운드에서 감지(SQS)하여 AI 분석을 수행하고, 최종 결과를 백엔드(TA) Core API 웹훅을 통해 전달합니다.
- **산출물:** 
  - [SA 파이프라인 시스템 설계](./sa-system-design.md)
  - [SA API 연동 규격](./api-integration.md)
  - [SA 인프라 배포 구조](./deployment-architecture.md)

## 2) 요건 분석 및 연동 기준
- **핵심 분석 포인트:**
  - AI 작업은 수분 이상 소요되므로 **비동기 SQS 기반 통신**을 필수적으로 사용합니다.
  - **Core API Webhook:** 데이터 무결성을 위해 AI 파이프라인이 생성한 모든 정형화 결과는 Core 백엔드 API가 수신하여 통제합니다.
- **TA/AA 기준 동기화 결과 (연동 기준):**
  - AI 처리 시작 지시(수신용): `AWS SQS (Long Polling)`
  - 결과 저장 및 상태 갱신: `Core API Webhook (POST Request)`

## 3) 설계 (인프라 및 파이프라인)
- **AWS All Managed 기반:** AWS SQS, AWS Transcribe(STT), Amazon Bedrock(LLM - Claude 3 Sonnet)을 적극 활용하여 서버 부하 지점을 외부로 위임했습니다.
- **최소 권한 원칙(Least Privilege):** SA 도커 환경이 해킹당하더라도 피해를 최소화하기 위해 ECR 접근 및 파이프라인 구동에 필요한 최소 권한만의 IAM 정책(`iam_policy_least_privilege.json`)을 인라인 설계하여 부여했습니다.

## 4) 구축 내역 (핵심 로직)
- `sqs_listener.py`: SQS 20초 롱 폴링 및 STT/LLM 연결의 심장 역할 조립.
- `stt_processor.py`: Boto3를 이용한 비동기 Transcribe Polling 구조.
- `llm_processor.py`: Claude 3의 프롬프트 엔지니어링 및 JSON 규격 반환 구조 확립.
- `api_client.py`: 추출된 최종 데이터를 백엔드 Core API로 송신하는 통합 통신 모듈.

## 5) 테스트 및 배포 내역
- [x] 목업 데이터(`local_test.py`)를 활용한 STT/LLM 결과 추출 및 JSON 형식 유지 1차 검증 완료.
- [x] OIDC(OpenID Connect)를 도입하여 인증 키드롭 없이 GitHub Actions 파이프라인(`deploy-sa.yml`) 배포 자동화 완료.

## 6) 증적 목록 (상세 문서 연결)
- [SA 파이프라인 시스템 설계 (sa-system-design.md)](./sa-system-design.md)
- [SA API 및 SQS 연동 규격 (api-integration.md)](./api-integration.md)
- [SA 인프라 배포 구조 (deployment-architecture.md)](./deployment-architecture.md)

## 7) 트러블슈팅 및 특이사항
1. **GitHub Secrets 및 IAM 키 영구 노출 보안 위협 방지**
   - **조치:** 초기의 IAM 사용자 Access Key 영구 발급 방식을 폐기하고, GitHub Actions 전용 OIDC(OpenID Connect) 단기 자격 증명을 도입하여 클라우드 보안성을 최고 수준으로 고도화했습니다.
2. **AWS Cross-Account(타 계정 연동) 접근 권한**
   - **증상:** SQS 큐 및 S3 버킷이 TA 파트 계정에 위치하므로 기본적으로 접근(Access Denied) 불가.
   - **조치:** TA 담당자에게 SA 계정 ID 번호(`818466672325`)를 전달하여 정책(Policy)에 화이트리스트(Whitelist)를 등록하도록 가이드하여 구조적 결함을 극복했습니다.
