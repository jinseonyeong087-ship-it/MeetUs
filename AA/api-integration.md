# API 연동 문서 (AA, TA 기준 동기화)

## 1. 개요
Frontend는 Core API를 통해 회의 생성/조회/상세 데이터를 받고, 비동기 AI 처리 상태를 polling으로 반영한다.

---

## 2. API 목록

## 2.1 로그인
- **POST** `/auth/login`

### Request (예시)
```json
{
  "email": "user@test.com",
  "password": "password"
}
```

### Response (예시)
```json
{
  "access_token": "jwt-token"
}
```

---

## 2.2 워크스페이스 목록 조회
- **GET** `/workspaces`

### Response (예시)
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

---

## 2.3 회의 생성 (업로드 시작)
- **POST** `/workspaces/{workspaceId}/meetings`

### Request (예시)
```json
{
  "title": "주간 스프린트 회의"
}
```

### Response (예시)
```json
{
  "meeting_id": "uuid",
  "workspace_id": "uuid",
  "status": "CREATED"
}
```

---

## 2.4 업로드 URL 발급
- **POST** `/meetings/{meetingId}/upload-url`

### Response (예시)
```json
{
  "upload_url": "https://example-presigned-url",
  "audio_key": "meetings/{meetingId}/audio.m4a"
}
```

---

## 2.5 업로드 완료 처리
- **POST** `/meetings/{meetingId}/upload-complete`

### Request (예시)
```json
{
  "audio_s3_key": "meetings/uuid/audio.m4a"
}
```

### Response (예시)
```json
{
  "status": "UPLOADED"
}
```

---

## 2.6 AI 처리 시작
- **POST** `/meetings/{meetingId}/process`

### Response (예시)
```json
{
  "status": "PROCESSING"
}
```

---

## 2.7 회의 목록 조회 (Archive)
- **GET** `/meetings?workspaceId=&query=&status=&fromDate=&toDate=&sort=&page=&size=`

### Response (예시)
```json
{
  "meetings": [
    {
      "meeting_id": "uuid",
      "title": "주간 스프린트 회의",
      "status": "PROCESSING",
      "created_at": "2026-02-27"
    }
  ],
  "total": 1
}
```

---

## 2.8 회의 상세 조회
- **GET** `/meetings/{meetingId}`

### Response (예시)
```json
{
  "meeting": {
    "meeting_id": "uuid",
    "title": "주간 스프린트 회의",
    "status": "COMPLETED"
  },
  "transcript": "...",
  "summary": "전체 요약 5~7줄",
  "decisions": "결정사항...",
  "todos": [
    {
      "todo_id": "uuid",
      "task": "아카이브 필터 UI 구현",
      "assignee": "홍길동",
      "status": "PENDING"
    }
  ]
}
```

---

## 2.9 To-Do 목록 조회
- **GET** `/todos?workspaceId=&meetingId=&assignee=&status=`

---

## 2.10 To-Do 상태 변경
- **PATCH** `/todos/{todoId}`

---

## 2.11 회의 재처리
- **POST** `/meetings/{meetingId}/retry`

---

## 3. 프론트 상태 처리 규칙
- `CREATED`, `UPLOADED`, `PROCESSING` 상태에서는 로딩/진행 상태 표시
- `FAILED` 수신 시 오류 메시지 + 재시도 UI 표시
- 상태값은 `CREATED`, `UPLOADED`, `PROCESSING`, `COMPLETED`, `FAILED`만 사용

---

## 4. 에러 처리 규약
- 4xx: 사용자 입력 오류 (메시지 노출)
- 5xx: 서버 오류 (재시도 유도)
- 공통 오류 응답 포맷
```json
{
  "code": "INTERNAL_ERROR",
  "message": "처리 중 오류가 발생했습니다."
}
```
