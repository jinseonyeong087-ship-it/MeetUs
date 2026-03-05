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

## 🎤 회의 업로드
### 3️⃣ 회의 생성

> **POST** /meetings

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
  "status": "CREATED"
}
```

### 4️⃣ S3 업로드 URL 발급

> **POST** /meetings/{meetingId}/upload-url

### Response
```json
{
  "upload_url": "https://s3-presigned-url",
  "audio_key": "meetings/{meetingId}/audio.m4a"
}
```

### 5️⃣ 업로드 완료

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

## 🤖 AI 처리 시작

### 6️⃣ AI 작업 요청 (SQS)

> **POST** /meetings/{meetingId}/process

**Core API 내부 동작**

> SQS sendMessage

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

## 📚 회의 조회
### 7️⃣ 회의 목록 조회

> **GET** /meetings

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
  ]
}
```

### 8️⃣ 회의 상세 조회

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

## 🔁 AI 결과 수신 (Webhook)
### 9️⃣ AI 결과 전달 API

> **POST** /internal/ai/result

AI Worker가 호출

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

Core API 처리

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

1. Frontend → POST /meetings
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

| UI 화면    | API                                 |
| -------- | ----------------------------------- |
| 회원가입     | POST /auth/signup                   |
| 로그인      | POST /auth/login                    |
| 회의 생성    | POST /meetings                      |
| 업로드 URL  | POST /meetings/{id}/upload-url      |
| 업로드 완료   | POST /meetings/{id}/upload-complete |
| AI 처리    | POST /meetings/{id}/process         |
| 회의 목록    | GET /meetings                       |
| 회의 상세    | GET /meetings/{id}                  |
| AI 결과 저장 | POST /internal/ai/result            |
