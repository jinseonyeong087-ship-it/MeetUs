# AWS 배포 작업 증적 (TA Backend) - 후속

- 작성일: 2026-03-11
- 작성자: TA(Backend)
- 범위: `AI-Minutes/backend` Core API ECS 배포 장애 조치, 내부 API 반영, SQS 크로스계정 권한 조치
- 선행 문서: `TA/aws-deploy-evidence-2026-03-09.md`

## 1) 작업 목적

- 2026-03-09 배포 이후 발생한 서비스 기동/헬스체크 이슈를 해소하여 ECS 서비스 정상화
- SA 연동 요청사항 반영 (`due_date`, `FAILED` 웹훅, 실패 사유 저장)
- SA 계정의 SQS 수신 접근권한(Cross-Account) 허용

## 2) 장애 및 조치 타임라인 (콘솔 이벤트 기준)

### 2.1 ECR 인증 토큰 조회 실패 (2026-03-09)

주요 에러:

```text
ResourceInitializationError: unable to pull secrets or registry auth
... ECR: GetAuthorizationToken ... i/o timeout
```

- 원인: 태스크의 ECR 접근 네트워크 경로 미확보
- 조치: ECS 서비스 네트워크 설정 재조정 후 재배포 진행

### 2.2 CloudWatch 로그 그룹 미존재 (2026-03-10 13:08~13:17)

주요 에러:

```text
ResourceInitializationError: failed to validate logger args
ResourceNotFoundException: The specified log group does not exist
```

- 원인: 태스크 정의 로그 설정의 로그 그룹 미생성
- 조치: CloudWatch Logs 그룹 `/ecs/ai-minutes-core-api` 생성

### 2.3 Target Group 헬스체크 타임아웃 (2026-03-10 13:32~13:51)

주요 에러:

```text
task ... port 8000 is unhealthy in target-group ... due to (reason Request timed out)
```

- 원인: ECS 태스크 보안그룹 설정 미흡(`default` 사용)
- 조치:
  - ECS Task 전용 SG(`ecs-core-api-sg`) 생성
  - 인바운드 `TCP 8000` 소스를 ALB SG로 제한 허용
  - 서비스 재배포 후 타겟 상태 `Healthy` 확인

## 3) 배포 정상화 결과

- ECS 서비스: `ai-minutes-core-api-service`
- 상태: `활성`
- 배포 상태: `성공`
- 실행 태스크: `1/1`
- Target Group 대상 상태: `Healthy`
- 테스트용 CORE_API_URL:
  - `http://meetus-alb-858165370.ap-northeast-2.elb.amazonaws.com`

## 4) 백엔드 코드 반영 증적 (SA 요청사항)

### 4.1 `/internal/ai/result`에 `due_date` 수용

- `AiTodoPayload`에 `due_date` 필드 추가
- Todo 저장 시 `due_date` 반영

### 4.2 `/internal/ai/failed` 웹훅 추가

- `POST /internal/ai/failed` 라우터 추가
- 요청 payload: `{"meeting_id": "...", "reason": "..."}`

### 4.3 실패 사유 저장 기능 추가

- `meetings.failure_reason` 컬럼 모델 반영
- `FAILED` 수신 시 `meeting.failure_reason = reason` 저장
- 성공/재처리/업로드완료 시 `failure_reason` 초기화 처리
- API 스펙 문서(`TA/api-spec.md`) 동기화 완료

## 5) DB 마이그레이션 적용 증적

- 파일: `backend/migrations/2026-03-11_meeting_failure_reason.sql`
- 내용: `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS failure_reason TEXT;`
- 적용 확인 쿼리 결과:

```text
column_name
-----------
failure_reason
(1 row)
```

## 6) SQS Cross-Account 권한 조치 증적

- 대상 큐: `arn:aws:sqs:ap-northeast-2:692681389373:meetus-process-queue`
- SA 계정 Principal 허용 추가:
  - `arn:aws:iam::818466672325:root`
- 허용 액션:
  - `sqs:ReceiveMessage`
  - `sqs:DeleteMessage`
  - `sqs:GetQueueAttributes`

## 7) 최종 상태 요약 (2026-03-11 기준)

- ECS 배포: 정상
- ALB 연동/헬스체크: 정상
- SA 연동 필수 API:
  - `POST /internal/ai/result` (`due_date` 포함)
  - `POST /internal/ai/failed` (`reason` 저장)
- DB 컬럼(`meetings.failure_reason`): 적용 완료
- SQS 크로스계정 수신 권한: 반영 완료
