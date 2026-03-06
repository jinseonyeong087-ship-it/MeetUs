## 🔐 Authentication
### 1️⃣ 로그인

> **POST** /auth/login

### Request
```json
{
  "email": "user@test.com",
  "password": "password"
}
```
### Response
```json
{
  "access_token": "jwt-token"
}
```

### 2️⃣ 회원가입

> **POST** /auth/signup

### Request
```json
{
  "email": "user@test.com",
  "name": "홍길동",
  "password": "password123"
}
```

### Response
```json
{
  "user_id": "uuid",
  "email": "user@test.com",
  "name": "홍길동"
}
```
---

### 🏢 Workspace API

워크스페이스는 협업의 기본 단위이며 회의와 To-Do 자원을 관리한다.

---

### 3️⃣ 워크스페이스 생성

> **POST** /workspaces

### Request
```json
{
  "name": "AI Project Team"
}
```
### Response
```json
{
  "workspace_id": "uuid",
  "name": "AI Project Team"
}
```

### 4️⃣ 워크스페이스 목록 조회

> **GET** /workspaces

### Response
```json
{
  "workspaces": [
    {
      "workspace_id": "uuid",
      "name": "AI Project Team",
      "role": "OWNER"
    }
  ]
}
```

### 5️⃣ 워크스페이스 초대

> **POST** /workspaces/{workspaceId}/invite

### Request
```json
{
  "email": "member@test.com"
}
```

### Response
```json
{
  "status": "invited"
}
```

### 6️⃣ 워크스페이스 나가기

> **POST** /workspaces/{workspaceId}/leave

### Response
```json
{
  "status": "left"
}
```

### 7️⃣ 워크스페이스 삭제

> **DELETE** /workspaces/{workspaceId}

### Response
```json
{
  "status": "deleted"
}
```
---
## 🎤 Meeting Upload

### 8️⃣ 회의 생성

> **POST** /workspaces/{workspaceId}/meetings

### Request
```json
{
  "title": "주간 회의"
}
```

### Response
```json
{
  "meeting_id": "uuid",
  "workspace_id": "uuid",
  "status": "CREATED"
}
```

### 9️⃣ S3 업로드 URL 발급

> **POST** /meetings/{meetingId}/upload-url

### Response
```json
{
  "upload_url": "https://s3-presigned-url",
  "audio_key": "meetings/{meetingId}/audio.m4a"
}
```

### 🔟 업로드 완료

> **POST** /meetings/{meetingId}/upload-complete

### Request
```json
{
  "audio_s3_key": "meetings/uuid/audio.m4a"
}
```

### Response
```json
{
  "status": "UPLOADED"
}
```

## 🤖 AI Processing

### 1️⃣1️⃣ AI 작업 요청 (SQS)

> **POST** /meetings/{meetingId}/process

**Core API 내부 동작**

```
SQS sendMessage
```

### Message Example (SQS)
```json
{
  "meeting_id": "uuid",
  "audio_s3_key": "meetings/uuid/audio.m4a"
}
```

### Response
```json
{
  "status": "PROCESSING"
}
```

## 📚 Meeting Query
### 1️⃣2️⃣ 회의 목록 조회

> **GET** /meetings

**Query Parameters**
| Parameter   | Description |
| ----------- | ----------- |
| workspaceId | 워크스페이스      |
| query       | 제목 검색       |
| status      | 상태 필터       |
| fromDate    | 시작 날짜       |
| toDate      | 종료 날짜       |
| sort        | 정렬          |
| page        | 페이지         |
| size        | 페이지 크기      |

**Example**

```
GET /meetings?workspaceId=123&status=COMPLETED&page=0&size=10
```

### Response
```json
{
  "meetings": [
    {
      "meeting_id": "uuid",
      "title": "주간 회의",
      "status": "COMPLETED",
      "created_at": "2026-03-05"
    }
  ],
  "total": 1
}
```

### 1️⃣3️⃣ 회의 상세 조회

> **GET** /meetings/{meetingId}

### Response
```json
{
  "meeting": {
    "meeting_id": "uuid",
    "title": "주간 회의",
    "status": "COMPLETED"
  },
  "summary": "회의 요약...",
  "decisions": "결정사항...",
  "transcript": "전체 대화",
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

## 🔁 Meeting Retry
### 1️⃣4️⃣ 회의 재처리

> **POST** /meetings/{meetingId}/retry

FAILED 상태의 회의를 다시 AI 처리한다.

### Response
```json
{
  "status": "PROCESSING"
}
```

## ✅ Todo API
### 1️⃣5️⃣ To-Do 목록 조회

> **GET** /todos

**Query Parameters**

| Parameter   | Description |
| ----------- | ----------- |
| workspaceId | 워크스페이스      |
| meetingId   | 회의          |
| assignee    | 담당자         |
| status      | 상태          |

### Response

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

### 1️⃣6️⃣ To-Do 상태 변경

> **PATCH** /todos/{todoId}

### Request

```json
{
  "status": "DONE"
}
```

### Response

```json
{
  "todo_id": "uuid",
  "status": "DONE"
}
```

## 🔁 AI Result Webhook
### 1️⃣7️⃣ AI 결과 전달 API

> **POST** /internal/ai/result

AI Worker가 호출하는 내부 API

### Request

```json
{
  "meeting_id": "uuid",
  "transcript": "전체 텍스트",
  "summary": "요약 내용",
  "decisions": "결정사항",
  "todos": [
    {
      "task": "보고서 작성",
      "assignee": "홍길동"
    }
  ]
}
```

### Core API 처리
```
DB 저장
meeting.status = COMPLETED
```

### Response
```json
{
  "status": "saved"
}
```
---
### 🧠 전체 흐름 (아키텍처 기준)

1. Frontend → POST /workspaces/{id}/meetings
2. Frontend → POST /meetings/{id}/upload-url
3. Frontend → S3 업로드
4. Frontend → POST /meetings/{id}/upload-complete

5. Frontend → POST /meetings/{id}/process
6. Core API → SQS

7. AI Worker → SQS polling
8. AI Worker → AWS Transcribe
9. AI Worker → Amazon Bedrock (Claude 3)

10. AI Worker → POST /internal/ai/result
11. Core API → DB 저장

12. Frontend → GET /meetings/{id}

### 📊 장점 (이 구조를 사용하는 이유)

| 문제          | 해결                     |
| ----------- | ---------------------- |
| API Timeout | SQS 기반 비동기 처리          |
| AI 서버 보안    | Worker 방식이라 외부 API 불필요 |
| 확장성         | Worker 수평 확장 가능        |
| 안정성         | 메시지 재처리 가능             |


실무에서도 많이 사용하는 안정적인 비동기 아키텍처 구조입니다.

## 📊 UI → API 매핑

| UI 화면       | API                                 |
| ----------- | ----------------------------------- |
| 회원가입        | POST /auth/signup                   |
| 로그인         | POST /auth/login                    |
| 워크스페이스 생성   | POST /workspaces                    |
| 워크스페이스 목록   | GET /workspaces                     |
| 회의 생성       | POST /workspaces/{id}/meetings      |
| 업로드 URL     | POST /meetings/{id}/upload-url      |
| 업로드 완료      | POST /meetings/{id}/upload-complete |
| AI 처리       | POST /meetings/{id}/process         |
| 회의 목록       | GET /meetings                       |
| 회의 상세       | GET /meetings/{id}                  |
| 회의 재처리      | POST /meetings/{id}/retry           |
| To-Do 조회    | GET /todos                          |
| To-Do 상태 변경 | PATCH /todos/{id}                   |
| AI 결과 저장    | POST /internal/ai/result            |

