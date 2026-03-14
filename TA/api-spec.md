# TA API Specification

이 문서는 현재 `backend` 구현 기준의 API 스펙이다. 경로, 요청 본문, 응답 예시는 실제 FastAPI 라우터 기준으로 정리했다.

## 1. 공통 규칙

### 1.1 Base URL

- Local: `http://127.0.0.1:8000`

### 1.2 인증

인증이 필요한 API는 아래 헤더를 사용한다.

```http
Authorization: Bearer <token>
```

토큰은 `POST /auth/login` 응답의 `access_token`이다.

### 1.3 공통 에러 응답

```json
{
  "code": "INTERNAL_ERROR",
  "message": "처리 중 오류가 발생했습니다."
}
```

대표 에러 코드:

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `VALIDATION_ERROR`
- `INTERNAL_ERROR`

## 2. Authentication

### 2.1 회원가입

`POST /auth/signup`

Request

```json
{
  "login_id": "usr_001",
  "email": "user@test.com",
  "name": "홍길동",
  "password": "password123"
}
```

Response

```json
{
  "user_id": "uuid",
  "login_id": "usr_001",
  "email": "user@test.com",
  "name": "홍길동"
}
```

### 2.2 로그인

`POST /auth/login`

Request

```json
{
  "login_id": "usr_001",
  "password": "password123"
}
```

Response

```json
{
  "access_token": "jwt-token"
}
```

## 3. Workspace API

### 3.1 워크스페이스 생성

`POST /workspaces`

인증 필요

Request

```json
{
  "name": "AI Project Team",
  "description": "백엔드 협업 공간"
}
```

Response

```json
{
  "workspace_id": "uuid",
  "name": "AI Project Team",
  "description": "백엔드 협업 공간"
}
```

### 3.2 워크스페이스 목록 조회

`GET /workspaces`

인증 필요

Response

```json
{
  "workspaces": [
    {
      "workspace_id": "uuid",
      "name": "AI Project Team",
      "description": "백엔드 협업 공간",
      "role": "OWNER"
    }
  ]
}
```

### 3.3 워크스페이스 초대

`POST /workspaces/{workspace_id}/invite`

인증 필요

Request

```json
{
  "email": "member@test.com"
}
```

Response

```json
{
  "status": "invited"
}
```

### 3.4 워크스페이스 멤버 목록 조회

`GET /workspaces/{workspace_id}/members`

인증 필요

Response

```json
{
  "members": [
    {
      "member_id": "uuid",
      "user_id": "uuid",
      "login_id": "usr_001",
      "email": "owner@test.com",
      "name": "Owner User",
      "role": "OWNER"
    }
  ]
}
```

### 3.5 워크스페이스 나가기

`POST /workspaces/{workspace_id}/leave`

인증 필요

Response

```json
{
  "status": "left"
}
```

### 3.6 워크스페이스 삭제

`DELETE /workspaces/{workspace_id}`

인증 필요

Response

```json
{
  "status": "deleted"
}
```

### 3.7 회의 생성

`POST /workspaces/{workspace_id}/meetings`

인증 필요

Request

```json
{
  "title": "주간 회의"
}
```

Response

```json
{
  "meeting_id": "uuid",
  "workspace_id": "uuid",
  "status": "CREATED"
}
```

## 4. Meeting API

### 4.1 회의 업로드 URL 발급

`POST /meetings/{meeting_id}/upload-url`

Response

```json
{
  "upload_url": "https://s3-presigned-url",
  "audio_key": "audio/{meeting_id}/uuid.m4a",
  "s3_key": "audio/{meeting_id}/uuid.m4a",
  "content_type": "audio/mp4"
}
```

### 4.2 업로드 완료 처리

`POST /meetings/{meeting_id}/upload-complete`

Request

```json
{
  "audio_s3_key": "audio/{meeting_id}/uuid.m4a"
}
```

Response

```json
{
  "status": "UPLOADED"
}
```

### 4.3 회의 목록 조회

`GET /meetings`

Query parameters

| Name | Type | Description |
| --- | --- | --- |
| `workspaceId` | string | 워크스페이스 ID |
| `status` | string | `CREATED`, `UPLOADED`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `query` | string | 제목 검색 |
| `fromDate` | date | 시작일 |
| `toDate` | date | 종료일 |
| `sort` | string | `date-desc`, `date-asc`, `status` |
| `page` | int | 기본값 `0` |
| `size` | int | 기본값 `10` |

Response

```json
{
  "meetings": [
    {
      "meeting_id": "uuid",
      "workspace_id": "uuid",
      "title": "주간 회의",
      "status": "COMPLETED",
      "failure_reason": null,
      "created_at": "2026-03-05T12:00:00"
    }
  ],
  "total": 1
}
```

### 4.4 회의 상세 조회

`GET /meetings/{meeting_id}`

Response

```json
{
  "meeting": {
    "meeting_id": "uuid",
    "workspace_id": "uuid",
    "title": "주간 회의",
    "status": "COMPLETED",
    "failure_reason": null,
    "created_at": "2026-03-05T12:00:00"
  },
  "summary": "회의 요약",
  "decisions": "결정사항",
  "transcript": "전체 대화",
  "todos": [
    {
      "todo_id": "uuid",
      "task": "보고서 작성",
      "status": "PENDING",
      "assignee": "홍길동",
      "due_date": "2026-03-31"
    }
  ]
}
```

### 4.5 AI 처리 요청

`POST /meetings/{meeting_id}/process`

동작

- 회의 상태를 `PROCESSING`으로 변경
- SQS에 처리 메시지 전송

SQS message example

```json
{
  "meeting_id": "uuid",
  "audio_s3_key": "audio/{meeting_id}/uuid.m4a",
  "workspace_id": "uuid",
  "title": "주간 회의"
}
```

Response

```json
{
  "status": "PROCESSING"
}
```

### 4.6 회의 재처리

`POST /meetings/{meeting_id}/retry`

동작

- 기존 상태와 무관하게 `PROCESSING`으로 변경 시도
- SQS에 처리 메시지 재전송

Response

```json
{
  "status": "PROCESSING"
}
```

### 4.7 회의 삭제

`DELETE /meetings/{meeting_id}`

인증 필요

권한

- 워크스페이스 소유자만 삭제 가능

Response

```json
{
  "status": "deleted"
}
```

## 5. Upload API

### 5.1 단독 업로드 URL 발급

`POST /upload/url`

Query parameters

| Name | Type | Description |
| --- | --- | --- |
| `meeting_id` | string | 회의 ID |

Response

```json
{
  "upload_url": "https://s3-presigned-url",
  "audio_key": "audio/{meeting_id}/uuid.m4a",
  "s3_key": "audio/{meeting_id}/uuid.m4a",
  "content_type": "audio/mp4"
}
```

## 6. Todo API

### 6.1 To-Do 목록 조회

`GET /todos`

Query parameters

| Name | Type | Description |
| --- | --- | --- |
| `workspaceId` | string | 워크스페이스 ID |
| `meetingId` | string | 회의 ID |
| `assignee` | string | 담당자 이름 검색 |
| `status` | string | `PENDING`, `IN_PROGRESS`, `DONE` |

Response

```json
{
  "todos": [
    {
      "todo_id": "uuid",
      "task": "보고서 작성",
      "assignee": "홍길동",
      "status": "PENDING"
    }
  ]
}
```

### 6.2 To-Do 상태 변경

`PATCH /todos/{todo_id}`

Request

```json
{
  "status": "DONE"
}
```

Response

```json
{
  "todo_id": "uuid",
  "status": "DONE"
}
```

## 7. Internal API

### 7.1 AI 결과 저장

`POST /internal/ai/result`

Request

```json
{
  "meeting_id": "uuid",
  "transcript": "전체 텍스트",
  "summary": "요약 내용",
  "decisions": "결정사항",
  "todos": [
    {
      "task": "보고서 작성",
      "assignee": "홍길동",
      "due_date": "2026-03-31"
    }
  ]
}
```

동작

- Transcript 저장 또는 갱신
- Summary / Decisions 저장 또는 갱신
- 기존 To-Do 삭제 후 재생성
- 회의 상태를 `COMPLETED`로 변경

Response

```json
{
  "status": "saved"
}
```

### 7.2 AI 실패 처리

`POST /internal/ai/failed`

Request

```json
{
  "meeting_id": "uuid",
  "reason": "STT timeout"
}
```

동작

- 회의 상태를 `FAILED`로 변경
- 실패 사유 저장

Response

```json
{
  "status": "failed"
}
```

## 8. 상태값

### 8.1 Meeting status

- `CREATED`
- `UPLOADED`
- `PROCESSING`
- `COMPLETED`
- `FAILED`

### 8.2 Todo status

- `PENDING`
- `IN_PROGRESS`
- `DONE`
