# API 명세서 통합본 (TA 기준)

## 기본 규칙
- Base URL: `/api/v1`
- 인증: `Authorization: Bearer <token>`
- 응답 형식: JSON
- 시간: ISO-8601 UTC 저장
- 상태값: `CREATED`, `UPLOADED`, `PROCESSING`, `COMPLETED`, `FAILED`

## 인증

### 1) 로그인
- `POST /auth/login`
- 요청 예시
```json
{
  "email": "user@test.com",
  "password": "password"
}
```
- 응답 예시
```json
{
  "access_token": "jwt-token"
}
```

### 2) 회원가입
- `POST /auth/signup`

## 워크스페이스

### 3) 워크스페이스 생성
- `POST /workspaces`

### 4) 워크스페이스 목록 조회
- `GET /workspaces`

### 5) 워크스페이스 초대
- `POST /workspaces/{workspaceId}/invite`

### 6) 워크스페이스 나가기
- `POST /workspaces/{workspaceId}/leave`

### 7) 워크스페이스 삭제
- `DELETE /workspaces/{workspaceId}`

## 회의 업로드/처리

### 8) 회의 생성
- `POST /workspaces/{workspaceId}/meetings`
- 요청 예시
```json
{
  "title": "주간 회의"
}
```
- 응답 예시
```json
{
  "meeting_id": "uuid",
  "workspace_id": "uuid",
  "status": "CREATED"
}
```

### 9) 업로드 URL 발급
- `POST /meetings/{meetingId}/upload-url`
- 응답 예시
```json
{
  "upload_url": "https://s3-presigned-url",
  "audio_key": "meetings/{meetingId}/audio.m4a"
}
```

### 10) 업로드 완료
- `POST /meetings/{meetingId}/upload-complete`
- 요청 예시
```json
{
  "audio_s3_key": "meetings/uuid/audio.m4a"
}
```

### 11) AI 처리 시작
- `POST /meetings/{meetingId}/process`

### 12) 회의 재처리
- `POST /meetings/{meetingId}/retry`

## 조회

### 13) 회의 목록 조회
- `GET /meetings?workspaceId=&query=&status=&fromDate=&toDate=&sort=&page=&size=`
- 응답 필드: `meetings[]`, `total`

### 14) 회의 상세 조회
- `GET /meetings/{meetingId}`
- 응답 필드: `meeting`, `summary`, `decisions`, `transcript`, `todos`

### 15) To-Do 목록 조회
- `GET /todos?workspaceId=&meetingId=&assignee=&status=`

### 16) To-Do 상태 변경
- `PATCH /todos/{todoId}`

## 내부 연동

### 17) AI 결과 저장(내부)
- `POST /internal/ai/result`
- 설명: AI Worker -> Core API 내부 웹훅

## 오류 코드 표준
- `400` 잘못된 요청
- `401` 인증 실패
- `403` 권한 없음
- `404` 리소스 없음
- `409` 상태 충돌
- `500` 서버 오류
