# 사용자 흐름도 (AA)

## 1. 메인 사용자 시나리오

### 1.1 사용자 진입 흐름
1. 사용자가 로그인한다.
2. 사용자가 자신이 속한 워크스페이스를 선택한다.
3. 워크스페이스 메인 또는 Archive 화면에 진입한다.
4. 사용자가 `회의 생성` 버튼을 선택한다.
5. 사용자가 회의 제목, 일시를 입력하고 `m4a` 파일을 선택한다.

### 1.2 회의 생성 및 업로드 흐름
1. Frontend가 `POST /meetings`로 회의 메타데이터를 생성한다.
2. Core API가 회의 정보를 RDS에 저장하고 상태를 `CREATED`로 반환한다.
3. Frontend가 `POST /meetings/{meetingId}/audio/presigned-url`을 호출한다.
4. Core API가 S3 업로드용 Presigned URL과 `objectKey`를 반환한다.
5. Frontend가 브라우저에서 Presigned URL로 `m4a` 파일을 직접 업로드한다.
6. 업로드 성공 후 Frontend가 `POST /meetings/{meetingId}/audio:complete`를 호출한다.
7. Core API가 회의 상태를 `UPLOADED`로 변경한다.
8. Frontend가 `POST /meetings/{meetingId}/processing:run`을 호출하거나, 업로드 완료 이벤트 기준 자동 처리 시작 상태를 조회한다.

### 1.3 AI 처리 및 결과 확인 흐름
1. Core API가 AI 처리 요청을 SQS에 적재한다.
2. AI Service가 SQS 메시지를 consume하고 S3의 원본 `m4a` 파일을 조회한다.
3. AI Service가 AWS Transcribe로 transcript를 생성한다.
4. AI Service가 transcript를 기반으로 OpenAI에 요약, 결정사항, 개인별 To-Do 생성을 요청한다.
5. AI Service가 transcript, summary, decisions, todos를 RDS에 저장한다.
6. 저장 완료 후 회의 상태를 `COMPLETED`로 변경한다.
7. Frontend는 상세 또는 Archive에서 상태 polling으로 결과를 갱신한다.
8. 사용자는 회의 상세에서 요약, 결정사항, transcript, 개인별 To-Do를 확인한다.

### 1.4 Archive 조회 흐름
1. 사용자가 Archive 화면으로 이동한다.
2. Frontend가 `GET /meetings`를 호출하여 목록을 조회한다.
3. 사용자는 검색, 상태 필터, 기간 필터, 정렬을 적용한다.
4. 특정 회의를 선택하면 상세 화면으로 이동한다.
5. `COMPLETED` 상태인 경우 결과를 즉시 표시한다.
6. `CREATED`, `UPLOADED`, `PROCESSING` 상태인 경우 진행 상태 UI를 유지한다.

---

## 2. 상태 전이 기준 사용자 흐름

### 2.1 회의 상태 전이
- `CREATED` → 회의 메타데이터 생성 완료, 파일 업로드 대기
- `UPLOADED` → 원본 음성 파일 S3 업로드 완료, 처리 요청 가능
- `PROCESSING` → 전사, 요약, To-Do 생성 중
- `COMPLETED` → transcript, 요약, 결정사항, 개인별 To-Do 조회 가능
- `FAILED` → 자동 재시도 초과 또는 최종 처리 실패

### 2.2 상태 전이 기준
| 현재 상태 | 다음 상태 | 사용자 행동 | 시스템 처리 |
|---|---|---|---|
| 없음 | `CREATED` | 회의 생성 | RDS에 회의 메타데이터 저장 |
| `CREATED` | `UPLOADED` | `m4a` 업로드 완료 | S3 저장 완료, 업로드 완료 API 반영 |
| `UPLOADED` | `PROCESSING` | 상세 화면 진입 또는 처리 시작 트리거 | Core API가 SQS에 작업 메시지 발행 |
| `PROCESSING` | `COMPLETED` | 결과 확인 대기 | AI Service가 transcript/요약/To-Do 생성 후 RDS 저장 |
| `PROCESSING` | `FAILED` | 재시도 대기 | AI 처리 3회 초과 실패 또는 처리 불가 |

### 2.3 Frontend 기준 상태 반영 흐름
1. 회의 생성 직후 상태를 `CREATED`로 즉시 표시한다.
2. 파일 업로드 성공 직후 상태를 `UPLOADED`로 갱신한다.
3. 처리 시작 응답 또는 상태 조회 결과가 반영되면 `PROCESSING` 뱃지와 안내 문구를 표시한다.
4. `PROCESSING` 상태에서는 상세 화면 진입 시 polling으로 상태를 반복 조회한다.
5. `COMPLETED` 전환 시 polling을 종료하고 결과 섹션을 렌더링한다.
6. `FAILED` 전환 시 polling을 종료하고 오류 UI와 재처리 액션을 표시한다.

---

## 3. 화면 이동 흐름

### 3.1 주요 화면 경로
- 로그인 화면 → 워크스페이스 선택/진입 화면 → 워크스페이스 메인 또는 Archive 화면
- 워크스페이스 메인/Archive 화면 → 회의 생성 화면
- 회의 생성 화면 → 업로드 진행 상태 표시 → 회의 상세 화면
- 회의 상세 화면 ↔ Archive 화면
- Archive 화면 → 특정 회의 상세 화면

### 3.2 화면별 이동 기준
| 현재 화면 | 사용자 액션 | 다음 화면 | 비고 |
|---|---|---|---|
| 로그인 | 인증 성공 | 워크스페이스 진입 | 인증 실패 시 로그인 화면 유지 |
| 워크스페이스 메인 | 회의 생성 클릭 | 회의 생성 화면 | 워크스페이스 멤버만 가능 |
| 회의 생성 화면 | 생성 및 업로드 성공 | 회의 상세 화면 | 상태는 `UPLOADED` 또는 `PROCESSING` |
| 회의 상세 화면 | Archive 이동 | Archive 화면 | 목록 복귀 |
| Archive 화면 | 회의 선택 | 회의 상세 화면 | 상태별 상세 UI 분기 |

### 3.3 화면 이동 시 데이터 갱신 기준
- 회의 생성 후 상세 화면 진입 시 최신 상태를 조회한다.
- Archive 복귀 시 목록을 새로 조회하여 최신 상태를 반영한다.
- `PROCESSING` 상태 상세 화면은 주기적 polling으로 결과 갱신한다.
- 사용자가 수동 새로고침을 수행하면 상태와 결과 데이터를 재조회한다.

---

## 4. 예외 시나리오

### 4.1 인증 및 권한 예외
- 미로그인 상태: 로그인 화면으로 리다이렉트
- 워크스페이스 미소속 사용자: 접근 거부 메시지 표시
- 만료된 토큰: 재로그인 유도

### 4.2 업로드 예외
- 확장자 오류: `m4a 파일만 업로드할 수 있습니다.` 메시지 표시
- 파일 크기 초과: `30MB 이하만 업로드할 수 있습니다.` 메시지 표시
- Presigned URL 만료: URL 재발급 후 재업로드 유도
- S3 업로드 실패: 실패 토스트와 `다시 업로드` 버튼 표시
- 업로드 완료 API 실패: 업로드 성공 여부 재확인 후 `완료 처리 재시도` 제공

### 4.3 AI 처리 예외
- SQS 적재 실패: 처리 시작 실패 메시지와 `다시 시도` 버튼 표시
- Transcribe 실패: 상태 `FAILED` 표시, 재처리 버튼 제공
- OpenAI 응답 실패: 상태 `FAILED` 표시, 재처리 버튼 제공
- DB 저장 실패: 상태 `FAILED` 표시, 결과 미노출
- 자동 재시도 초과: 최종 실패 안내와 운영자 문의 또는 재처리 유도

### 4.4 조회 예외
- 결과 없음: Empty State 표시
- 상세 조회 실패: 오류 메시지와 `새로고침` 버튼 제공
- Archive 조회 실패: 목록 영역 오류 메시지와 재조회 버튼 제공

### 4.5 오류 발생 시 사용자 인터랙션 기준
| 오류 유형 | UI 표시 | 사용자 액션 |
|---|---|---|
| 입력 오류(4xx) | 필드 하단 에러 문구 | 입력 수정 후 재시도 |
| 인증 오류(401) | 세션 만료 안내 | 재로그인 |
| 권한 오류(403) | 접근 제한 메시지 | 이전 화면 이동 |
| 상태 충돌(409) | 현재 상태 안내 | 새로고침 후 재시도 |
| 서버 오류(5xx) | 토스트 또는 인라인 오류 | 재시도 또는 새로고침 |

---

## 5. 시스템 처리 흐름 (Backend / AI 파이프라인 요약)

### 5.1 구성 요소
- Frontend: Vanilla JS
- Core API: Python API
- Storage: AWS S3
- Queue: AWS SQS
- AI: AWS Transcribe + OpenAI
- DB: RDS

### 5.2 사용자 행동 ↔ 시스템 처리 연결
| 사용자 행동 | Frontend 처리 | Backend / Infra 처리 |
|---|---|---|
| 로그인 | 토큰 저장 및 인증 상태 유지 | 인증 검증 |
| 워크스페이스 진입 | 워크스페이스 목록/기본 데이터 조회 | 권한 검증, 워크스페이스 데이터 조회 |
| 회의 생성 | 회의 생성 API 호출 | RDS에 회의 저장, `CREATED` 반환 |
| 파일 업로드 | Presigned URL 요청 후 S3 직접 업로드 | S3 업로드 URL 발급 |
| 업로드 완료 | 완료 API 호출 | 상태 `UPLOADED` 반영 |
| 처리 시작 | 상태 전환 대기 또는 시작 API 호출 | SQS 메시지 발행, 상태 `PROCESSING` 반영 |
| 결과 조회 | 상세/목록 상태 polling | AI Service 처리 결과를 RDS에서 조회 |

### 5.3 백엔드 처리 순서
1. Frontend가 Core API에 회의 생성 요청을 보낸다.
2. Core API가 RDS에 회의 메타데이터를 저장한다.
3. Core API가 Presigned URL을 발급한다.
4. Frontend가 브라우저에서 S3로 직접 `m4a` 파일을 업로드한다.
5. 업로드 완료 후 Core API가 상태를 `UPLOADED`로 변경한다.
6. Core API가 SQS에 처리 작업 메시지를 발행한다.
7. AI Service가 SQS 메시지를 수신하고 회의 상태를 `PROCESSING`으로 변경한다.
8. AI Service가 S3 원본 파일을 읽어 AWS Transcribe에 전사를 요청한다.
9. AI Service가 생성된 transcript를 기반으로 OpenAI에 요약/결정사항/개인별 To-Do 생성을 요청한다.
10. AI Service가 transcript, summary, decisions, todos를 RDS에 저장한다.
11. 저장이 완료되면 회의 상태를 `COMPLETED`로 변경한다.
12. 실패 시 재시도 정책을 적용하고 최종 실패 시 `FAILED`로 종료한다.

### 5.4 Frontend polling / refresh 기준
- 대상 화면: 회의 상세, Archive 목록
- 대상 상태: `CREATED`, `UPLOADED`, `PROCESSING`
- 기본 방식: `GET /meetings/{meetingId}` 또는 `GET /meetings` 재조회
- 종료 조건: `COMPLETED`, `FAILED`
- 수동 보완: 사용자가 `새로고침` 또는 `다시 확인` 버튼으로 즉시 재조회 가능
- 목적: 비동기 AI 처리 결과를 실시간에 가깝게 반영

---

## 6. 상태별 UI 표시 기준

### 6.1 상태별 UI 표시 방식
| 상태 | Archive 표시 | 상세 화면 표시 | 사용자 액션 |
|---|---|---|---|
| `CREATED` | 회색 뱃지, `업로드 대기` 문구 | 파일 업로드 영역 활성화 | 파일 선택, 업로드 |
| `UPLOADED` | 파란 뱃지, `업로드 완료` 문구 | 처리 시작 안내, 결과 영역 비활성 | 상태 확인 |
| `PROCESSING` | 주황 뱃지, 스피너 표시 | 스켈레톤, 진행 메시지, 자동 갱신 안내 | 대기, 새로고침 |
| `COMPLETED` | 초록 뱃지, 요약 생성 완료 표시 | 요약, 결정사항, transcript, To-Do 표시 | 결과 확인, Archive 이동 |
| `FAILED` | 빨간 뱃지, 실패 문구 | 오류 메시지, 실패 사유, 재처리 버튼 | 재처리, 새로고침 |

### 6.2 Frontend 관점 상태 표시 UX
- 상태는 뱃지, 텍스트, 로딩 컴포넌트로 동시에 표현한다.
- `PROCESSING` 상태에서는 단순 로딩이 아니라 `전사 및 요약 생성 중` 같은 작업 의미를 노출한다.
- `COMPLETED` 상태 전환 시 스켈레톤을 제거하고 결과 섹션을 즉시 교체 렌더링한다.
- `FAILED` 상태에서는 결과 영역 대신 오류 영역을 우선 표시한다.
- 상세 화면에서는 사용자가 현재 대기 중인지, 실패했는지, 조회 가능한지 즉시 판단할 수 있어야 한다.

### 6.3 상태별 UI 표시 예시
- `CREATED`: `오디오 파일을 업로드하면 분석이 시작됩니다.`
- `UPLOADED`: `업로드가 완료되었습니다. 곧 AI 분석이 시작됩니다.`
- `PROCESSING`: `회의 내용을 분석 중입니다. 완료되면 결과가 자동으로 갱신됩니다.`
- `COMPLETED`: `AI 요약과 개인별 To-Do가 생성되었습니다.`
- `FAILED`: `분석 중 오류가 발생했습니다. 다시 시도해주세요.`

### 6.4 공통 UI 원칙
- 목록과 상세 모두 동일한 상태 ENUM만 사용한다.
- 로딩 중에는 스켈레톤을 사용하고, 오류는 토스트와 인라인 메시지를 함께 사용한다.
- 결과가 없는 경우 Empty State를 명확히 구분한다.
- 모바일에서는 목록을 카드형으로 전환하되 상태 정보와 주요 액션은 동일하게 유지한다.
