export const mockMeetings = [
  {
    id: 'mtg-001',
    title: '주간 제품 회의',
    date: '2026-02-27T10:00:00+09:00',
    status: 'COMPLETED',
    participants: ['민수', '지현', '영호'],
    summary:
      '신규 릴리즈 일정 확정, 온보딩 UX 개선안 승인, 알림 기능은 다음 스프린트로 이월.',
    todos: [
      { assignee: '민수', task: '릴리즈 노트 초안 작성', dueDate: '2026-03-03', done: false },
      { assignee: '지현', task: '온보딩 화면 시안 반영', dueDate: '2026-03-05', done: false },
      { assignee: '영호', task: 'QA 체크리스트 업데이트', dueDate: '2026-03-04', done: true }
    ]
  },
  {
    id: 'mtg-002',
    title: '고객 인터뷰 회고',
    date: '2026-02-28T14:00:00+09:00',
    status: 'PROCESSING',
    participants: ['수연', '태훈'],
    summary: '전사 및 요약 처리 중입니다.',
    todos: [
      { assignee: '수연', task: '인터뷰 인사이트 문서화', dueDate: '2026-03-02', done: false }
    ]
  },
  {
    id: 'mtg-003',
    title: '파트너사 킥오프',
    date: '2026-02-28T16:30:00+09:00',
    status: 'FAILED',
    participants: ['Alex', '민수'],
    summary: '전사 실패: 오디오 품질 이슈로 재처리 필요.',
    todos: []
  },
  {
    id: 'mtg-004',
    title: '신규 회의 초안',
    date: '2026-02-28T18:00:00+09:00',
    status: 'CREATED',
    participants: ['지현', '영호', '수연'],
    summary: '회의 생성 후 업로드 대기 중입니다.',
    todos: []
  },
  {
    id: 'mtg-005',
    title: '신규 미팅 업로드',
    date: '2026-02-28T20:30:00+09:00',
    status: 'UPLOADED',
    participants: ['민수'],
    summary: '업로드 완료 후 대기 중.',
    todos: []
  }
];
