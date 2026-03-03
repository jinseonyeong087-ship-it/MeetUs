# 상태 흐름도 (AA)

## 회의 처리 상태
- CREATED
- UPLOADED
- PROCESSING
- COMPLETED
- FAILED

## Mermaid State Diagram
```mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> UPLOADED: 오디오 업로드 완료
    UPLOADED --> PROCESSING: 전사/요약/To-Do 처리 시작
    PROCESSING --> PROCESSING: 자동 재시도(최대 3회, 로그만 기록)
    PROCESSING --> COMPLETED: transcript, 요약, 결정사항, To-Do 저장 성공
    PROCESSING --> FAILED: 재시도 3회 초과 또는 최종 처리 실패
```

## 상태 전이 규칙
- 상태값은 현재 위치만 표현한다
- Retry는 별도 로그로 관리한다
- FAILED 상태에서는 실패 원인과 재시도 이력 저장이 필요하다
- COMPLETED 이후 수정은 재처리 작업으로만 허용
