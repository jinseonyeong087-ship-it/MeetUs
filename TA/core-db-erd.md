# Core DB ERD

`TA/database-design.md` 기준으로 핵심 테이블만 추린 Mermaid ERD 문서입니다.

```mermaid
erDiagram
    users {
        UUID user_id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR name
        TIMESTAMP created_at
    }

    workspaces {
        UUID workspace_id PK
        VARCHAR name
        UUID owner_id FK
        TIMESTAMP created_at
    }

    workspace_members {
        UUID member_id PK
        UUID workspace_id FK
        UUID user_id FK
        VARCHAR role
        TIMESTAMP created_at
    }

    meetings {
        UUID meeting_id PK
        UUID workspace_id FK
        VARCHAR title
        ENUM status
        TEXT audio_s3_key
        TEXT failure_reason
        TIMESTAMP created_at
    }

    transcripts {
        UUID meeting_id PK, FK
        TEXT full_text
        TIMESTAMP created_at
    }

    summaries {
        UUID meeting_id PK, FK
        TEXT summary_text
        TEXT decisions_text
        TIMESTAMP created_at
    }

    todos {
        UUID todo_id PK
        UUID meeting_id FK
        UUID assignee_member_id FK
        TEXT task
        DATE due_date
        ENUM status
        TIMESTAMP created_at
    }

    retry_logs {
        UUID retry_log_id PK
        UUID meeting_id FK
        INT attempt_no
        TEXT reason
        TIMESTAMP created_at
    }

    users ||--o{ workspaces : owns
    users ||--o{ workspace_members : joins
    workspaces ||--o{ workspace_members : has
    workspaces ||--o{ meetings : contains
    meetings ||--|| transcripts : has
    meetings ||--|| summaries : has
    meetings ||--o{ todos : creates
    meetings ||--o{ retry_logs : records
    workspace_members o|--o{ todos : assigned_to
```

## Notes

- `workspace_members`는 `UNIQUE (workspace_id, user_id)` 제약으로 워크스페이스 내 사용자 중복을 방지한다.
- `meetings.status`는 `CREATED`, `UPLOADED`, `PROCESSING`, `COMPLETED`, `FAILED` 값을 사용한다.
- `todos.status`는 `PENDING`, `IN_PROGRESS`, `DONE` 값을 사용한다.
- `transcripts`, `summaries`는 `meetings`와 1:1 구조다.
- `todos.assignee_member_id`는 NULL 가능하며, 담당자 매핑 실패 시 비어 있을 수 있다.
