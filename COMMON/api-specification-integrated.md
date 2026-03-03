# API 명세서 통합본 (AA)

## 기본 규칙
- Base URL: `/api/v1`
- 인증: `Authorization: Bearer <token>`
- 응답 형식: JSON
- 시간: ISO-8601 UTC 저장
- 모든 회의는 워크스페이스 소유다

## 주요 엔드포인트

### 1) 회의 생성
- `POST /meetings`
- 요청
```json
{
  "workspaceId": "uuid",
  "title": "주간 스탠드업",
  "startedAt": "2026-02-27T01:00:00Z"
}
```
- 응답 예시
```json
{
  "meetingId": "mtg_123",
  "status": "CREATED"
}
```

### 2) 오디오 업로드
- `POST /meetings/{meetingId}/audio/presigned-url`
- 설명: `m4a`, 30MB 이하 파일 업로드를 위한 Presigned URL 발급
- 응답 예시
```json
{
  "uploadUrl": "https://example-presigned-url",
  "objectKey": "workspaces/ws_1/meetings/mtg_123/audio/source.m4a",
  "expiresIn": 900
}
```

### 3) 업로드 완료 처리
- `POST /meetings/{meetingId}/audio:complete`
- 응답 예시
```json
{
  "meetingId": "mtg_123",
  "status": "UPLOADED"
}
```

### 4) 처리 시작
- `POST /meetings/{meetingId}/processing:run`
- 응답 예시
```json
{
  "meetingId": "mtg_123",
  "status": "PROCESSING"
}
```

### 5) 액션 아이템 조회
- `GET /meetings/{meetingId}/action-items`
- 응답 예시
```json
[
  {
    "assignee": "홍길동",
    "task": "보고서 작성",
    "due_date": null
  }
]
```

### 6) 회의 결과 통합 조회
- `GET /meetings/{meetingId}/result`
- 전사/요약/결정사항/액션 아이템 묶음 반환

### 7) 회의 상태 ENUM
```text
CREATED
UPLOADED
PROCESSING
COMPLETED
FAILED
```

## 오류 코드 표준
- `400` 잘못된 요청
- `401` 인증 실패
- `403` 권한 없음
- `404` 리소스 없음
- `409` 상태 충돌
- `500` 서버 오류

## 운영 고려 항목
- 비동기 작업 상태 조회 방식(Webhook vs Polling)
- Rate Limit 기준
- API 버전 폐기 정책
