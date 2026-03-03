# API 연동 문서 (AA)

## 1. 개요
Frontend는 Core API를 통해 회의 생성/조회/상세 데이터를 받고, AI 처리 상태를 폴링 또는 SSE로 반영한다.

---

## 2. API 목록

## 2.1 회의 생성 (업로드 시작)
- **POST** `/meetings`
- 설명: 워크스페이스 소유 회의 메타데이터 생성

### Request (예시)
```json
{
  "workspaceId": "ws_123",
  "title": "주간 스프린트 회의",
  "startedAt": "2026-02-27T03:00:00Z"
}
```

### Response (예시)
```json
{
  "meetingId": "mtg_123",
  "status": "CREATED"
}
```

---

## 2.2 업로드 URL 발급
- **POST** `/meetings/{meetingId}/audio/presigned-url`
- 설명: `m4a`, 30MB 이하 파일 업로드용 Presigned URL 발급

### Request (예시)
```json
{
  "fileName": "meeting-2026-02-27.m4a",
  "contentType": "audio/mp4",
  "fileSize": 26214400
}
```

### Response (예시)
```json
{
  "uploadUrl": "https://example-presigned-url",
  "objectKey": "workspaces/ws_123/meetings/mtg_123/audio/source.m4a",
  "expiresIn": 900
}
```

---

## 2.3 업로드 완료 처리
- **POST** `/meetings/{meetingId}/audio:complete`

### Response (예시)
```json
{
  "meetingId": "mtg_123",
  "status": "UPLOADED"
}
```

---

## 2.4 회의 목록 조회 (Archive)
- **GET** `/meetings?query=&status=&from=&to=&sort=createdAt,desc&page=0&size=20`

### Response (예시)
```json
{
  "content": [
    {
      "meetingId": "mtg_123",
      "title": "주간 스프린트 회의",
      "status": "PROCESSING",
      "createdAt": "2026-02-27T03:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1
}
```

---

## 2.5 회의 상세 조회
- **GET** `/meetings/{meetingId}`

### Response (예시)
```json
{
  "meetingId": "mtg_123",
  "title": "주간 스프린트 회의",
  "status": "COMPLETED",
  "transcript": "...",
  "summary": "전체 요약 5~7줄",
  "decisions": [
    "3월 2주차 배포 일정 확정"
  ]
}
```

---

## 2.6 개인별 To-Do 조회
- **GET** `/meetings/{meetingId}/todos`

### Response (예시)
```json
[
  {
    "assignee": "홍길동",
    "task": "아카이브 필터 UI 구현",
    "due_date": "2026-03-02"
  }
]
```

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
