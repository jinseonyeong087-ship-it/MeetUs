# MeetUs 전체 시스템 플로우차트

## 1. 목적
MeetUs의 전체 시스템 흐름을 사용자 요청, 업로드, 비동기 AI 처리, 저장, 모니터링 기준으로 간결하게 표현한다.

---

## 2. 전체 시스템 플로우차트

```mermaid
flowchart LR
    U[User Browser];

    subgraph AWS[Amazon Web Services]
        ALB[ALB];
        L[Production Listener];
        TG_FE[Frontend Target Group];
        TG_API[API Target Group];

        FE[Frontend Service<br/>ECS Fargate];
        API[Core API Service<br/>ECS Fargate];
        Q[SQS Queue];
        AI[AI Processing Service<br/>ECS Fargate];

        S3[(S3 Audio Storage)];
        RDS[(RDS Database)];
        CW[CloudWatch Logs and Alarms];
        NAT[NAT Gateway];
    end

    TRANS[AWS Transcribe];
    BEDROCK[Amazon Bedrock (Claude 3) API];
    EMAIL[Email Alert];
    GHA[GitHub Actions];
    ECR[Amazon ECR];
    CD[CodeDeploy];

    U --> ALB;
    ALB --> L;
    L --> TG_FE;
    L --> TG_API;
    TG_FE --> FE;
    TG_API --> API;

    FE --> API;
    API -->|Presigned URL 생성| FE;
    FE -->|Presigned URL 제공| U;
    U -->|Audio Upload m4a| S3;

    API --> RDS;
    API -->|처리 작업 발행| Q;
    AI -. SQS Polling .-> Q;
    Q -->|Job 전달| AI;

    AI -->|오디오 조회| S3;
    AI -->|STT 요청| TRANS;
    TRANS -->|Transcript 반환| AI;
    AI --> NAT;
    NAT -->|요약 및 To-Do 요청| BEDROCK;
    BEDROCK -->|결과 반환| AI;
    AI -->|결과 저장| RDS;

    FE --> CW;
    API --> CW;
    AI --> CW;
    ALB --> CW;
    RDS --> CW;
    CW --> EMAIL;

    GHA --> ECR;
    ECR --> CD;
    CD --> FE;
    CD --> API;
```

---

## 3. 흐름 요약
1. 사용자는 브라우저에서 ALB를 통해 Frontend와 Core API에 접근한다.
2. Frontend는 Core API로 회의를 생성하고 Presigned URL을 발급받는다.
3. Frontend는 사용자에게 Presigned URL을 전달하고, 사용자는 `m4a` 파일을 S3에 직접 업로드한다.
4. Core API는 업로드 완료 후 SQS에 AI 처리 작업을 발행한다.
5. AI Processing Service는 SQS를 polling하여 작업을 가져오고, S3 원본 파일을 읽어 AWS Transcribe와 Amazon Bedrock (Claude 3)를 호출한다.
6. 처리 결과는 RDS에 저장되고 Frontend는 API를 통해 상태와 결과를 조회한다.
7. 서비스 로그와 주요 인프라 지표는 CloudWatch로 수집하고, 이상 징후는 Email로 알린다.

---

## 4. 표현 기준
- 서비스 라우팅은 Frontend와 API Target Group을 분리해 표현한다.
- 업로드 흐름은 `Presigned URL 발급`과 `사용자 직접 S3 업로드`를 분리해 표현한다.
- AI 처리 흐름은 `SQS → AI Service → Transcribe / Amazon Bedrock (Claude 3) → RDS` 구조로 고정한다.
- 발표용 가독성을 위해 세부 서브넷과 ECS Task Set은 생략하고, CI/CD는 배포 방향만 유지한다.
