## ?” Authentication
### 1ï¸âƒ£ ë¡œê·¸??

> **POST** /auth/login

### Request
```json
{
  "login_id": "user001",
  "password": "password"
}
```
### Response
```json
{
  "access_token": "jwt-token"
}
```

### 2ï¸âƒ£ ?Œì›ê°€??

> **POST** /auth/signup

### Request
```json
{
  "login_id": "user001",
  "email": "user@test.com",
  "name": "?ê¸¸??,
  "password": "password123"
}
```

### Response
```json
{
  "user_id": "uuid",
  "login_id": "user001",
  "email": "user@test.com",
  "name": "?ê¸¸??
}
```
---

### ?¢ Workspace API

?Œí¬?¤í˜?´ìŠ¤???‘ì—…??ê¸°ë³¸ ?¨ìœ„?´ë©° ?Œì˜?€ To-Do ?ì›??ê´€ë¦¬í•œ??

---

### 3ï¸âƒ£ ?Œí¬?¤í˜?´ìŠ¤ ?ì„±

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

### 4ï¸âƒ£ ?Œí¬?¤í˜?´ìŠ¤ ëª©ë¡ ì¡°íšŒ

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

### 5ï¸âƒ£ ?Œí¬?¤í˜?´ìŠ¤ ì´ˆë?

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

### 6ï¸âƒ£ ?Œí¬?¤í˜?´ìŠ¤ ?˜ê?ê¸?

> **POST** /workspaces/{workspaceId}/leave

### Response
```json
{
  "status": "left"
}
```

### 7ï¸âƒ£ ?Œí¬?¤í˜?´ìŠ¤ ?? œ

> **DELETE** /workspaces/{workspaceId}

### Response
```json
{
  "status": "deleted"
}
```
---
## ?¤ Meeting Upload

### 8ï¸âƒ£ ?Œì˜ ?ì„±

> **POST** /workspaces/{workspaceId}/meetings

### Request
```json
{
  "title": "ì£¼ê°„ ?Œì˜"
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

### 9ï¸âƒ£ S3 ?…ë¡œ??URL ë°œê¸‰

> **POST** /meetings/{meetingId}/upload-url

### Response
```json
{
  "upload_url": "https://s3-presigned-url",
  "audio_key": "audio/{meetingId}/uuid.m4a",
  "s3_key": "audio/{meetingId}/uuid.m4a",
  "content_type": "audio/mp4"
}
```

### ?”Ÿ ?…ë¡œ???„ë£Œ

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

## ?¤– AI Processing

### 1ï¸âƒ£1ï¸âƒ£ AI ?‘ì—… ?”ì²­ (SQS)

> **POST** /meetings/{meetingId}/process

**Core API ?´ë? ?™ì‘**

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

## ?“š Meeting Query
### 1ï¸âƒ£2ï¸âƒ£ ?Œì˜ ëª©ë¡ ì¡°íšŒ

> **GET** /meetings

**Query Parameters**
| Parameter   | Description |
| ----------- | ----------- |
| workspaceId | ?Œí¬?¤í˜?´ìŠ¤      |
| query       | ?œëª© ê²€??      |
| status      | ?íƒœ ?„í„°       |
| fromDate    | ?œì‘ ? ì§œ       |
| toDate      | ì¢…ë£Œ ? ì§œ       |
| sort        | ?•ë ¬          |
| page        | ?˜ì´ì§€         |
| size        | ?˜ì´ì§€ ?¬ê¸°      |

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
      "title": "ì£¼ê°„ ?Œì˜",
      "status": "COMPLETED",
      "created_at": "2026-03-05"
    }
  ],
  "total": 1
}
```

### 1ï¸âƒ£3ï¸âƒ£ ?Œì˜ ?ì„¸ ì¡°íšŒ

> **GET** /meetings/{meetingId}

### Response
```json
{
  "meeting": {
    "meeting_id": "uuid",
    "title": "ì£¼ê°„ ?Œì˜",
    "status": "COMPLETED"
  },
  "summary": "?Œì˜ ?”ì•½...",
  "decisions": "ê²°ì •?¬í•­...",
  "transcript": "?„ì²´ ?€??,
  "todos": [
    {
      "todo_id": "uuid",
      "task": "ë³´ê³ ???‘ì„±",
      "assignee": "?ê¸¸??,
      "status": "PENDING"
    }
  ]
}
```

## ?” Meeting Retry
### 1ï¸âƒ£4ï¸âƒ£ ?Œì˜ ?¬ì²˜ë¦?

> **POST** /meetings/{meetingId}/retry

FAILED ?íƒœ???Œì˜ë¥??¤ì‹œ AI ì²˜ë¦¬?œë‹¤.

### Response
```json
{
  "status": "PROCESSING"
}
```

## ??Todo API
### 1ï¸âƒ£5ï¸âƒ£ To-Do ëª©ë¡ ì¡°íšŒ

> **GET** /todos

**Query Parameters**

| Parameter   | Description |
| ----------- | ----------- |
| workspaceId | ?Œí¬?¤í˜?´ìŠ¤      |
| meetingId   | ?Œì˜          |
| assignee    | ?´ë‹¹??        |
| status      | ?íƒœ          |

### Response

```json
{
  "todos": [
    {
      "todo_id": "uuid",
      "task": "ë³´ê³ ???‘ì„±",
      "assignee": "?ê¸¸??,
      "status": "PENDING"
    }
  ]
}
```

### 1ï¸âƒ£6ï¸âƒ£ To-Do ?íƒœ ë³€ê²?

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

## ?” AI Result Webhook
### 1ï¸âƒ£7ï¸âƒ£ AI ê²°ê³¼ ?„ë‹¬ API

> **POST** /internal/ai/result

AI Workerê°€ ?¸ì¶œ?˜ëŠ” ?´ë? API

### Request

```json
{
  "meeting_id": "uuid",
  "transcript": "?„ì²´ ?ìŠ¤??,
  "summary": "?”ì•½ ?´ìš©",
  "decisions": "ê²°ì •?¬í•­",
  "todos": [
    {
      "task": "ë³´ê³ ???‘ì„±",
      "assignee": "?ê¸¸??
    }
  ]
}
```

### Core API ì²˜ë¦¬
```
DB ?€??
meeting.status = COMPLETED
```

### Response
```json
{
  "status": "saved"
}
```

---
## Common Error Response

```json
{
  "code": "INTERNAL_ERROR",
  "message": "ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤."
}
```
---
### ?§  ?„ì²´ ?ë¦„ (?„í‚¤?ì²˜ ê¸°ì?)

1. Frontend ??POST /workspaces/{id}/meetings
2. Frontend ??POST /meetings/{id}/upload-url
3. Frontend ??S3 ?…ë¡œ??
4. Frontend ??POST /meetings/{id}/upload-complete

5. Frontend ??POST /meetings/{id}/process
6. Core API ??SQS

7. AI Worker ??SQS polling
8. AI Worker ??AWS Transcribe
9. AI Worker ??Amazon Bedrock (Claude 3)

10. AI Worker ??POST /internal/ai/result
11. Core API ??DB ?€??

12. Frontend ??GET /meetings/{id}

### ?“Š ?¥ì  (??êµ¬ì¡°ë¥??¬ìš©?˜ëŠ” ?´ìœ )

| ë¬¸ì œ          | ?´ê²°                     |
| ----------- | ---------------------- |
| API Timeout | SQS ê¸°ë°˜ ë¹„ë™ê¸?ì²˜ë¦¬          |
| AI ?œë²„ ë³´ì•ˆ    | Worker ë°©ì‹?´ë¼ ?¸ë? API ë¶ˆí•„??|
| ?•ì¥??        | Worker ?˜í‰ ?•ì¥ ê°€??       |
| ?ˆì •??        | ë©”ì‹œì§€ ?¬ì²˜ë¦?ê°€??            |


?¤ë¬´?ì„œ??ë§ì´ ?¬ìš©?˜ëŠ” ?ˆì •?ì¸ ë¹„ë™ê¸??„í‚¤?ì²˜ êµ¬ì¡°?…ë‹ˆ??

## ?“Š UI ??API ë§¤í•‘

| UI ?”ë©´       | API                                 |
| ----------- | ----------------------------------- |
| ?Œì›ê°€??       | POST /auth/signup                   |
| ë¡œê·¸??        | POST /auth/login                    |
| ?Œí¬?¤í˜?´ìŠ¤ ?ì„±   | POST /workspaces                    |
| ?Œí¬?¤í˜?´ìŠ¤ ëª©ë¡   | GET /workspaces                     |
| ?Œì˜ ?ì„±       | POST /workspaces/{id}/meetings      |
| ?…ë¡œ??URL     | POST /meetings/{id}/upload-url      |
| ?…ë¡œ???„ë£Œ      | POST /meetings/{id}/upload-complete |
| AI ì²˜ë¦¬       | POST /meetings/{id}/process         |
| ?Œì˜ ëª©ë¡       | GET /meetings                       |
| ?Œì˜ ?ì„¸       | GET /meetings/{id}                  |
| ?Œì˜ ?¬ì²˜ë¦?     | POST /meetings/{id}/retry           |
| To-Do ì¡°íšŒ    | GET /todos                          |
| To-Do ?íƒœ ë³€ê²?| PATCH /todos/{id}                   |
| AI ê²°ê³¼ ?€??   | POST /internal/ai/result            |




