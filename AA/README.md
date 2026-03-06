# AI-Minutes

## 초안
<img src="/AA/img/first.png">

## AA 산출물
<img src="/AA/img/image3.png">

ECS Frontend Service 배포 + ALB 연결
<img src="/AA/img/front.png">

## AWS root 계정에서 IAM user 권한
<img src="/AA/img/IAMuser.png">

## ECR Repository (Docker 이미지 저장소) 생성
<img src="/AA/img/ECRrepository.png">

## S3 Bucket (파일 업로드 저장소) 생성
<img src="/AA/img/S3_Bucket.png">

## ECS Cluster 생성
<img src="/AA/img/ECS_cluster.png">


# AA 작업 증적 (Frontend/Integration/Infra)

본 문서는 AA 파트의 작업 이력을 아래 절차로 정리한 증적 문서다.

`요건 만들기 -> 요건 분석 -> 설계(인프라) -> 구축 -> 테스트(화면캡쳐, md 정리) -> 증적`

## 1) 요건 만들기
- 목표: 회의 업로드부터 요약/To-Do 조회까지 Frontend 사용자 흐름 정의
- 산출물:
  - [화면설계서](/home/xkak9/projects/AI-Minutes/AA/ui-spec.md)
  - [사용자 흐름도](/home/xkak9/projects/AI-Minutes/AA/user-flow.md)
  - [Frontend 시스템 설계](/home/xkak9/projects/AI-Minutes/AA/frontend-system-design.md)

## 2) 요건 분석
- 핵심 분석 포인트:
  - 비동기 처리 상태(`CREATED`, `UPLOADED`, `PROCESSING`, `COMPLETED`, `FAILED`) 기반 UI 필요
  - 업로드는 Presigned URL로 브라우저 직접 S3 업로드
  - 회의/To-Do 조회는 목록 + 상세 + 상태 재확인 흐름 필요
- TA 기준 동기화 결과:
  - 회의 생성: `POST /workspaces/{workspaceId}/meetings`
  - 업로드 URL: `POST /meetings/{meetingId}/upload-url`
  - 업로드 완료: `POST /meetings/{meetingId}/upload-complete`
  - 처리 시작/재처리: `POST /meetings/{meetingId}/process`, `POST /meetings/{meetingId}/retry`
  - To-Do: `GET /todos`, `PATCH /todos/{todoId}`
  - 기준 문서: [TA API 명세](/home/xkak9/projects/AI-Minutes/TA/api-spec.md)

## 3) 설계 (인프라)
- 배포/네트워크/아키텍처 문서 정리:
  - [배포 구조 문서](/home/xkak9/projects/AI-Minutes/AA/deployment-architecture.md)
  - [네트워크 구성도](/home/xkak9/projects/AI-Minutes/COMMON/network-topology.md)
  - [시스템 플로우차트](/home/xkak9/projects/AI-Minutes/COMMON/system-flowchart.md)
  - [MSA 플로우차트](/home/xkak9/projects/AI-Minutes/COMMON/ai-minutes-msa-flowchart-horizontal-highlight.mmd)
- 정리 기준:
  - All AWS 기준 유지
  - AWS Managed AI(Transcribe/Bedrock) 기준으로 표현
  - NAT 의존 표기 제거

## 4) 구축
- 문서 구축:
  - AA/COMMON 문서의 API 경로를 TA 스펙으로 정합화
  - 용어 통일: OpenAI 표기 -> Amazon Bedrock(Claude 3)
  - Mermaid 렌더링 오류 없는 문법으로 수정
- 프론트 반영(참고):
  - [workspaceApi](/home/xkak9/projects/AI-Minutes/frontend/api/workspaceApi.js)
  - [meetingsApi](/home/xkak9/projects/AI-Minutes/frontend/api/meetingsApi.js)
  - [workspaces 페이지](/home/xkak9/projects/AI-Minutes/frontend/pages/workspaces.js)

## 5) 테스트 (화면 캡처 + md 정리)
- md 검증:
  - 문서 내 구버전 엔드포인트 제거 여부 점검
  - Mermaid 다이어그램 구문 오류 제거
- 화면 캡처 증적:
  - 초기 초안: `/AA/img/image.png`
  - AA 산출물 화면: `/AA/img/image3.png`
  - Front ECS/ALB 배포 화면: `/AA/img/front.png`

## 6) 증적 목록
- 요구/분석/설계/구축 결과 문서:
  - [AA/ui-spec.md](/home/xkak9/projects/AI-Minutes/AA/ui-spec.md)
  - [AA/user-flow.md](/home/xkak9/projects/AI-Minutes/AA/user-flow.md)
  - [AA/api-integration.md](/home/xkak9/projects/AI-Minutes/AA/api-integration.md)
  - [AA/frontend-system-design.md](/home/xkak9/projects/AI-Minutes/AA/frontend-system-design.md)
  - [AA/deployment-architecture.md](/home/xkak9/projects/AI-Minutes/AA/deployment-architecture.md)
  - [COMMON/api-specification-integrated.md](/home/xkak9/projects/AI-Minutes/COMMON/api-specification-integrated.md)
  - [COMMON/system-flowchart.md](/home/xkak9/projects/AI-Minutes/COMMON/system-flowchart.md)
  - [COMMON/network-topology.md](/home/xkak9/projects/AI-Minutes/COMMON/network-topology.md)
  - [COMMON/architecture-diagram.md](/home/xkak9/projects/AI-Minutes/COMMON/architecture-diagram.md)
  - [COMMON/ai-minutes-msa-flowchart-horizontal-highlight.mmd](/home/xkak9/projects/AI-Minutes/COMMON/ai-minutes-msa-flowchart-horizontal-highlight.mmd)

## 7) 트러블슈팅
1. API 경로 불일치
- 증상: AA/COMMON 문서가 `POST /meetings`, `/audio:complete`, `/processing:run` 등 구버전 경로 사용
- 원인: TA 최신 API 반영 전 문서 잔존
- 조치: TA 명세 기준으로 전면 치환 (`/workspaces/{workspaceId}/meetings`, `/upload-url`, `/upload-complete`, `/process`, `/retry`, `/todos`)

2. 필드 네이밍 불일치
- 증상: camelCase(`meetingId`, `uploadUrl`)와 snake_case(`meeting_id`, `upload_url`) 혼재
- 원인: 문서 작성 주체별 표기 차이
- 조치: TA 기준 우선으로 예시/테이블 표기 정리

3. Mermaid 렌더링 실패
- 증상: `Parse error ... Amazon Bedrock (Claude 3) API`
- 원인: 노드 라벨 괄호/파서 해석 이슈
- 조치: 라벨을 파서 안전 형식으로 수정 (`BEDROCK["Amazon Bedrock Claude 3 API"]`)

4. NAT/외부 경계 혼선
- 증상: All AWS 구조인데 NAT 및 외부 API처럼 보이는 다이어그램
- 원인: 과거 외부 LLM 가정 도식 잔존
- 조치: NAT 제거, Transcribe/Bedrock를 AWS 내부 관리형 서비스로 재배치
