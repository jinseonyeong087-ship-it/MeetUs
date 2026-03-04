# Frontend System Design (AA)

## 1. 개요
본 문서는 AI 회의 요약 & 개인별 To-Do 아카이브 시스템의 Frontend 구조와 동작 방식을 정의한다.

### 1.1 적용 범위
- Frontend: Vanilla JavaScript, HTML, CSS
- 정적 서빙: Nginx
- 배포: Docker, ECR, ECS(Fargate), ALB
- 연동 대상: Python Core API, S3, SQS 기반 비동기 처리 결과

### 1.2 설계 원칙
- Frontend는 정적 리소스 기반으로 구성한다.
- 상태 기반 UI를 명확하게 표시한다.
- 파일 업로드는 Presigned URL을 이용한 S3 직접 업로드로 처리한다.
- API 통신은 `fetch` 기반 JSON 요청/응답 구조로 통일한다.
- 비동기 AI 처리 상태는 polling 기반으로 반영한다.

---

## 2. Frontend Architecture

### 2.1 전체 구조
- Browser
- ALB
- ECS Frontend Service (Nginx + 정적 파일)
- Core API Service
- S3
- SQS
- AI Processing Service
- RDS

### 2.2 요청 흐름
1. 사용자가 브라우저로 서비스에 접속한다.
2. 요청은 ALB를 통해 ECS Frontend Service로 전달된다.
3. Nginx가 HTML, CSS, JavaScript 정적 리소스를 응답한다.
4. 브라우저의 JavaScript가 Core API에 `fetch` 요청을 보낸다.
5. Core API는 회의 생성, 상태 조회, 목록 조회, 상세 조회를 처리한다.
6. 파일 업로드는 Core API가 발급한 Presigned URL을 이용해 브라우저에서 S3로 직접 전송한다.
7. 업로드 완료 후 Core API가 SQS를 통해 AI Processing Service를 트리거한다.
8. AI Processing Service는 Transcribe/OpenAI 처리 후 결과를 RDS에 저장한다.
9. Frontend는 상태 polling으로 결과를 갱신한다.

### 2.3 브라우저 → ALB → API 흐름
`Browser → ALB → ECS Frontend(Nginx) → Browser JS → Core API → RDS / S3 / SQS`

### 2.4 정적 리소스 구조
- `index.html`: 앱 진입 파일
- `css/`: 공통 스타일, 페이지별 스타일
- `js/`: 라우팅, 상태 처리, 이벤트 바인딩
- `api/`: API 요청 모듈
- `components/`: 재사용 UI 컴포넌트
- `pages/`: 화면 단위 렌더링 로직

---

## 3. Frontend 디렉토리 구조

```text
frontend/
├── index.html
├── css/
│   ├── base.css
│   ├── layout.css
│   └── pages/
├── js/
│   ├── app.js
│   ├── router.js
│   ├── state.js
│   └── utils/
├── api/
│   ├── client.js
│   ├── meetings.js
│   └── uploads.js
├── components/
│   ├── header.js
│   ├── status-badge.js
│   ├── loading.js
│   ├── empty-state.js
│   └── toast.js
└── pages/
    ├── upload-page.js
    ├── meeting-list-page.js
    ├── meeting-detail-page.js
    └── archive-page.js
```

### 3.1 폴더 역할
| 경로 | 역할 |
|---|---|
| `index.html` | 애플리케이션 진입 HTML |
| `css/` | 공통 및 화면별 스타일 정의 |
| `js/` | 앱 초기화, 라우팅, 상태 및 유틸리티 |
| `api/` | Core API 호출 모듈 |
| `components/` | 재사용 가능한 UI 조각 |
| `pages/` | 페이지 단위 렌더링 및 이벤트 처리 |

### 3.2 설계 기준
- 페이지 로직과 API 호출 로직을 분리한다.
- 재사용 가능한 UI는 `components/`로 분리한다.
- 상태 관련 로직은 공통 모듈로 관리한다.
- CSS는 공통 레이아웃과 화면 전용 스타일을 분리한다.

---

## 4. Frontend 주요 페이지

### 4.1 Upload Page
- 역할: 회의 생성, `m4a` 파일 선택, 업로드 진행, 상세 화면 진입
- 주요 UI: 제목 입력, 일시 입력, 파일 드롭존, 업로드 버튼, 진행률 바, 상태 메시지
- 주요 액션: 회의 생성, Presigned URL 요청, S3 업로드, 업로드 완료 처리

### 4.2 Meeting List Page
- 역할: 현재 워크스페이스의 회의 목록 조회
- 주요 UI: 목록 테이블 또는 카드, 상태 뱃지, 최신순 정렬, 새 회의 버튼
- 주요 액션: 상세 진입, 새 회의 생성 진입, 상태 확인

### 4.3 Meeting Detail Page
- 역할: 회의 결과 상세 조회
- 주요 UI: 상태 뱃지, 요약, 결정사항, transcript, 개인별 To-Do, 새로고침 버튼
- 주요 액션: 결과 확인, polling 상태 갱신, 재처리, Archive 복귀

### 4.4 Archive Page
- 역할: 과거 회의 검색, 필터, 정렬, 상태 기준 조회
- 주요 UI: 검색창, 기간 필터, 상태 필터, 정렬 드롭다운, 목록 영역, Empty State
- 주요 액션: 검색, 필터 적용, 상세 이동, 새로고침

---

## 5. API 통신 구조

### 5.1 통신 방식
- 브라우저에서 `fetch`를 사용해 Core API와 통신한다.
- 요청/응답 데이터 형식은 JSON으로 통일한다.
- 인증 토큰은 `Authorization: Bearer <token>` 헤더로 전달한다.
- 업로드 파일 전송은 Presigned URL에 대해 별도 HTTP 요청으로 수행한다.

### 5.2 API 모듈 분리 기준
| 모듈 | 역할 |
|---|---|
| `api/client.js` | 공통 `fetch` 래퍼, 헤더 처리, 공통 에러 처리 |
| `api/meetings.js` | 회의 생성, 목록 조회, 상세 조회, 상태 조회 |
| `api/uploads.js` | Presigned URL 요청, 업로드 완료 처리 |

### 5.3 공통 API 호출 예시
```js
export async function apiFetch(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      code: 'UNKNOWN_ERROR',
      message: '요청 처리 중 오류가 발생했습니다.'
    }));

    throw new Error(errorBody.message);
  }

  return response.json();
}
```

### 5.4 회의 생성 예시
```js
import { apiFetch } from './client.js';

export function createMeeting(payload) {
  return apiFetch('/meetings', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
```

### 5.5 API 에러 처리 방식
- 4xx 오류: 사용자 입력 오류 또는 권한 오류로 분류하고 인라인 메시지를 표시한다.
- 5xx 오류: 서버 일시 오류로 분류하고 토스트와 재시도 버튼을 표시한다.
- 네트워크 오류: 연결 실패 메시지와 새로고침 또는 재시도 버튼을 제공한다.

---

## 6. 상태 관리 흐름

### 6.1 회의 상태
```text
CREATED
UPLOADED
PROCESSING
COMPLETED
FAILED
```

### 6.2 상태별 Frontend 표시 기준
| 상태 | UI 표시 | 사용자 액션 |
|---|---|---|
| `CREATED` | 업로드 대기 메시지, 업로드 버튼 활성 | 파일 선택, 업로드 시작 |
| `UPLOADED` | 업로드 완료 메시지, 처리 대기 안내 | 상태 확인, 상세 진입 |
| `PROCESSING` | 스켈레톤, 스피너, `분석 중` 메시지 | 새로고침, 대기 |
| `COMPLETED` | 요약, 결정사항, transcript, To-Do 렌더링 | 결과 확인 |
| `FAILED` | 실패 메시지, 재처리 버튼, 오류 안내 | 재처리, 새로고침 |

### 6.3 상태 반영 흐름
1. 회의 생성 성공 시 `CREATED`를 반영한다.
2. S3 업로드 성공 후 `UPLOADED`를 반영한다.
3. 처리 시작 상태가 조회되면 `PROCESSING`으로 전환한다.
4. 결과 조회 성공 시 `COMPLETED`로 전환하고 polling을 종료한다.
5. 실패 응답 또는 최종 실패 상태 수신 시 `FAILED`로 전환한다.

---

## 7. 파일 업로드 처리 구조

### 7.1 업로드 흐름
1. 사용자가 Upload Page에서 `m4a` 파일을 선택한다.
2. Frontend가 `POST /meetings`로 회의를 생성한다.
3. Frontend가 `POST /meetings/{meetingId}/audio/presigned-url`을 호출한다.
4. Core API가 Presigned URL과 `objectKey`를 반환한다.
5. Frontend가 브라우저에서 S3에 직접 업로드한다.
6. 업로드 완료 후 `POST /meetings/{meetingId}/audio:complete`를 호출한다.
7. 처리 시작 후 상세 화면으로 이동한다.

### 7.2 업로드 진행률 표시
- 파일 업로드 시작 시 진행률 바를 노출한다.
- 업로드 퍼센트와 현재 단계 메시지를 함께 표시한다.
- 완료 시 `업로드 완료` 메시지로 전환한다.
- 실패 시 `다시 업로드` 버튼을 노출한다.

### 7.3 업로드 처리 예시
```js
export async function uploadToS3(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file
  });

  if (!response.ok) {
    throw new Error('파일 업로드에 실패했습니다.');
  }
}
```

---

## 8. 사용자 인터랙션 흐름

### 8.1 파일 업로드
`파일 선택 → 회의 생성 → Presigned URL 요청 → S3 업로드 → 업로드 완료 처리 → 상태 변경`

### 8.2 회의 목록 조회
`목록 진입 → GET /meetings → 상태 뱃지 렌더링 → 상세 화면 이동`

### 8.3 상세 결과 조회
`상세 진입 → GET /meetings/{id} → 상태 확인 → PROCESSING이면 polling → COMPLETED 시 결과 렌더링`

### 8.4 Archive 검색
`검색어 입력 → 필터 적용 → 목록 재조회 → 결과 표시`

---

## 9. 에러 처리 전략

### 9.1 API 실패
- UI 처리: 토스트 메시지 + 인라인 오류 문구
- 사용자 액션: 재시도, 새로고침
- 대상: 목록 조회, 상세 조회, 회의 생성, 상태 조회

### 9.2 업로드 실패
- UI 처리: 업로드 실패 메시지, 진행률 중단, `다시 업로드` 버튼 표시
- 사용자 액션: Presigned URL 재요청 후 재업로드
- 대상: S3 직접 업로드, 업로드 완료 API 실패

### 9.3 AI 처리 실패
- UI 처리: 상태 `FAILED` 뱃지, 실패 안내 문구, 재처리 버튼
- 사용자 액션: 상태 재조회 또는 재처리
- 대상: Transcribe 실패, OpenAI 실패, 결과 저장 실패

### 9.4 사용자 메시지 기준
- 입력 오류: `입력 값을 확인해주세요.`
- 권한 오류: `이 회의에 접근할 수 없습니다.`
- 서버 오류: `처리 중 오류가 발생했습니다. 다시 시도해주세요.`
- 업로드 오류: `파일 업로드에 실패했습니다. 다시 시도해주세요.`

---

## 10. 성능 고려 사항

### 10.1 API 호출 최소화
- 최초 진입 시 필요한 데이터만 요청한다.
- 상세 화면에서는 결과가 필요한 경우에만 추가 API를 호출한다.
- 중복 요청을 방지하기 위해 동일 상태 요청은 병합하거나 직전 요청 완료 후 수행한다.

### 10.2 상태 polling 전략
- 대상 상태: `CREATED`, `UPLOADED`, `PROCESSING`
- 대상 화면: Meeting Detail Page, Archive Page
- 종료 조건: `COMPLETED`, `FAILED`
- 사용자가 화면을 이탈하면 polling을 중단한다.

### 10.3 로딩 UX
- 목록 화면: 스켈레톤 또는 테이블 로딩 표시
- 상세 화면: 섹션 단위 스켈레톤 표시
- 업로드 화면: 단계 메시지와 진행률 바 표시
- 빈 데이터 상태와 오류 상태를 명확히 구분한다.

---

## 11. 배포 구조

### 11.1 Frontend 배포 흐름
`Docker Build → ECR Push → ECS(Fargate) 배포 → ALB 연결`

### 11.2 Frontend 서비스 구조
- Vanilla JS, HTML, CSS 정적 파일을 Docker 이미지에 포함한다.
- Nginx가 정적 파일을 서빙한다.
- ECS Frontend Service는 ALB 뒤에서 동작한다.
- CodeDeploy가 Blue-Green 방식으로 신규 Task Set을 배포한다.
- ALB Listener 전환 후 새 버전이 운영 트래픽을 수신한다.

### 11.3 운영 기준
- 배포 이미지는 Git SHA 태그를 사용한다.
- 헬스체크 통과 후에만 트래픽을 전환한다.
- 실패 시 이전 Target Group으로 즉시 롤백한다.
- 환경 변수는 ECS Task Definition 기준으로 관리한다.

