# Database Schema

## 🔑 Primary Key Strategy (UUID)

본 시스템의 모든 주요 엔터티는 기본 키(Primary Key)로 UUID (Universally Unique Identifier) 를 사용한다.

UUID는 전 세계적으로 고유한 값을 생성할 수 있는 식별자로, 분산 환경에서도 충돌 없이 안정적으로 ID를 생성할 수 있다.

### 🔹 UUID를 사용하는 이유

### 1. 보안성

AUTO_INCREMENT와 달리 ID가 예측되지 않아 URL 추측 공격을 방지할 수 있다.

### 2. 분산 시스템 친화적

여러 서비스나 서버에서 동시에 ID를 생성해도 충돌 위험이 없다.

### 3. 외부 리소스 연동

S3 객체 키, API 응답, 로그 추적 등 외부 시스템과 연동 시 안정적인 식별자로 활용 가능하다.

### 4. 확장성

향후 마이크로서비스 구조로 확장할 경우에도 ID 생성 전략을 변경할 필요가 없다.

### 🔹 PostgreSQL 구현 방식

PostgreSQL에서는 pgcrypto extension의 gen_random_uuid() 함수를 사용하여 UUID를 생성한다.
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```
이 함수를 통해 각 테이블의 Primary Key는 다음과 같이 자동 생성된다.
```sql
user_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```
<br>

## 📦 DB 테이블 명세

## 👤 User (users)
🔹 설명

> 개인 단위로 가입하는 서비스 사용자 엔터티이다.

🔹 필드 정의
| Field      | Type         | Constraint       | Description |
| ---------- | ------------ | ---------------- | ----------- |
| user_id    | UUID         | PK               | 사용자 식별자     |
| email      | VARCHAR(255) | UNIQUE, NOT NULL | 사용자 이메일     |
| password   | VARCHAR(255) | NOT NULL         | 사용자 비밀번호   |
| name       | VARCHAR(100) | NOT NULL         | 사용자 이름      |
| created_at | TIMESTAMP    | NOT NULL         | 계정 생성 시간    |

## 🏢 Workspace (workspaces)

🔹 설명

> 협업의 기본 단위이며 회의 자원을 소유한다.

🔹 필드 정의
| Field        | Type         | Constraint | Description   |
| ------------ | ------------ | ---------- | ------------- |
| workspace_id | UUID         | PK         | 워크스페이스 식별자    |
| name         | VARCHAR(255) | NOT NULL   | 워크스페이스 이름     |
| owner_id     | UUID         | FK         | 워크스페이스 생성 사용자 |
| created_at   | TIMESTAMP    | NOT NULL   | 생성 시간         |

🔹 Foreign Key
| Field    | Reference     |
| -------- | ------------- |
| owner_id | users.user_id |

## 👥 Workspace Member (workspace_members)

🔹 설명

> 워크스페이스에 참여한 사용자 정보를 관리한다.

🔹 필드 정의
| Field        | Type        | Constraint | Description |
| ------------ | ----------- | ---------- | ----------- |
| member_id    | UUID        | PK         | 멤버 식별자      |
| workspace_id | UUID        | FK         | 워크스페이스      |
| user_id      | UUID        | FK         | 사용자         |
| role         | VARCHAR(50) | NOT NULL   | 멤버 역할       |
| created_at   | TIMESTAMP   | NOT NULL   | 참여 시간       |

🔹 Foreign Key
| Field        | Reference               |
| ------------ | ----------------------- |
| workspace_id | workspaces.workspace_id |
| user_id      | users.user_id           |

## 📅 Meeting (meetings)

🔹 설명

> 워크스페이스에 속한 회의 메타데이터를 관리한다.

🔹 필드 정의
| Field        | Type         | Constraint | Description |
| ------------ | ------------ | ---------- | ----------- |
| meeting_id   | UUID         | PK         | 회의 식별자      |
| workspace_id | UUID         | FK         | 워크스페이스      |
| title        | VARCHAR(255) | NOT NULL   | 회의 제목       |
| status       | ENUM         | NOT NULL   | 회의 상태       |
| audio_s3_key | TEXT         | NOT NULL   | S3 음성 파일 경로 |
| created_at   | TIMESTAMP    | NOT NULL   | 생성 시간       |

🔹 Foreign Key
| Field        | Reference               |
| ------------ | ----------------------- |
| workspace_id | workspaces.workspace_id |

## 📝 Transcript (transcript)

🔹 설명

> 회의 음성 파일을 전사한 전체 텍스트를 저장한다.

🔹 필드 정의
| Field      | Type      | Constraint | Description   |
| ---------- | --------- | ---------- | ------------- |
| meeting_id | UUID      | PK, FK     | 회의 식별자        |
| full_text  | TEXT      | NOT NULL   | 전체 transcript |
| created_at | TIMESTAMP | NOT NULL   | 생성 시간         |

🔹 관계
```
Meeting 1 : 1 Transcript
```

## 📄 Summary (summaries)

🔹 설명

> 회의 요약 및 결정사항을 저장한다.

🔹 필드 정의
| Field          | Type      | Constraint | Description |
| -------------- | --------- | ---------- | ----------- |
| meeting_id     | UUID      | PK, FK     | 회의 식별자      |
| summary_text   | TEXT      | NOT NULL   | 전체 요약       |
| decisions_text | TEXT      | NOT NULL   | 결정사항        |
| created_at     | TIMESTAMP | NOT NULL   | 생성 시간       |

🔹 관계
```
Meeting 1 : 1 Summary
```

## ✅ Todo (todos)

🔹 설명

> 회의에서 도출된 개인별 액션 아이템을 관리한다.

🔹 필드 정의
| Field              | Type      | Constraint | Description |
| ------------------ | --------- | ---------- | ----------- |
| todo_id            | UUID      | PK         | To-Do 식별자   |
| meeting_id         | UUID      | FK         | 회의 식별자      |
| assignee_member_id | UUID      | FK         | 담당 멤버       |
| task               | TEXT      | NOT NULL   | 수행 작업       |
| due_date           | DATE      | NULL       | 마감일         |
| status             | ENUM      | NOT NULL   | 작업 상태       |
| created_at         | TIMESTAMP | NOT NULL   | 생성 시간       |

🔹 관계
```
Meeting 1 : N Todo
```

## 🔁 Retry Log (retry_logs)

🔹 설명

> AI 처리 실패 시 재시도 이력을 기록한다.

🔹 필드 정의
| Field        | Type      | Constraint | Description |
| ------------ | --------- | ---------- | ----------- |
| retry_log_id | UUID      | PK         | 로그 식별자      |
| meeting_id   | UUID      | FK         | 회의 식별자      |
| attempt_no   | INT       | NOT NULL   | 재시도 횟수      |
| reason       | TEXT      | NULL       | 실패 원인       |
| created_at   | TIMESTAMP | NOT NULL   | 생성 시간       |

🔹 관계
```
Meeting 1 : N RetryLog
```

## 📊 Entity Relationship Overview
```
User
 └─ Workspace
     └─ WorkspaceMember
     └─ Meeting
         ├─ Transcript
         ├─ Summary
         ├─ Todo
         └─ RetryLog
```
<br>

# 🗄️ Database DDL
### 🔹 PostgreSQL Extension
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```
UUID 생성을 위해 PostgreSQL pgcrypto extension을 사용한다.

### 🔹 ENUM 정의

### Meeting Status
```sql
CREATE TYPE meeting_status AS ENUM (
  'CREATED',
  'UPLOADED',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);
```
### Todo Status
```sql
CREATE TYPE todo_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'DONE'
);
```
---
### 🔹 Users
```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```
---
### 🔹 Workspaces
```sql
CREATE TABLE workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (owner_id)
    REFERENCES users(user_id)
);
```
---
### 🔹 Workspace Members
```sql
CREATE TABLE workspace_members (
  member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (workspace_id, user_id),

  FOREIGN KEY (workspace_id)
    REFERENCES workspaces(workspace_id)
    ON DELETE CASCADE,

  FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);
```
---
### 🔹 Meetings
```sql
CREATE TABLE meetings (
  meeting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  status meeting_status NOT NULL DEFAULT 'CREATED',
  audio_s3_key TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (workspace_id)
    REFERENCES workspaces(workspace_id)
    ON DELETE CASCADE
);
```
---
### 🔹 Transcripts
```sql
CREATE TABLE transcripts (
  meeting_id UUID PRIMARY KEY,
  full_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (meeting_id)
    REFERENCES meetings(meeting_id)
    ON DELETE CASCADE
);
```
---
### 🔹 Summaries
```sql
CREATE TABLE summaries (
  meeting_id UUID PRIMARY KEY,
  summary_text TEXT NOT NULL,
  decisions_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (meeting_id)
    REFERENCES meetings(meeting_id)
    ON DELETE CASCADE
);
```
---
### 🔹 Todos
```sql
CREATE TABLE todos (
  todo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  assignee_member_id UUID NOT NULL,
  task TEXT NOT NULL,
  due_date DATE,
  status todo_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (meeting_id)
    REFERENCES meetings(meeting_id)
    ON DELETE CASCADE,

  FOREIGN KEY (assignee_member_id)
    REFERENCES workspace_members(member_id)
);
```
---
### 🔹 Retry Logs
```sql
CREATE TABLE retry_logs (
  retry_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  attempt_no INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY (meeting_id)
    REFERENCES meetings(meeting_id)
    ON DELETE CASCADE
);
```

## 📊 Index 설계
```sql
CREATE INDEX idx_meetings_workspace
ON meetings(workspace_id);

CREATE INDEX idx_meetings_status
ON meetings(status);

CREATE INDEX idx_todos_meeting
ON todos(meeting_id);

CREATE INDEX idx_todos_status
ON todos(status);

CREATE INDEX idx_retry_logs_meeting
ON retry_logs(meeting_id);
```

## 🧠 설계 포인트

- PostgreSQL UUID 기반 PK 사용

- Meeting → Transcript / Summary 1:1 관계

- Meeting → Todo / RetryLog 1:N 관계

- To-Do 담당자는 workspace_member 기준으로 관리

- 모든 하위 테이블은 ON DELETE CASCADE 적용
