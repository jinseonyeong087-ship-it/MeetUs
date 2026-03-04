export const seedUser = {
  id: 'user-001',
  name: '민수',
  email: 'minsu@meetus.app'
};

export const seedWorkspaces = [
  {
    id: 'ws-personal-001',
    name: '민수의 개인 보관함',
    role: 'Owner',
    members: 1,
    description: '개인 회의 음성 업로드와 요약 확인을 위한 기본 개인 워크스페이스입니다.',
    type: 'PERSONAL'
  },
  {
    id: 'ws-001',
    name: 'Product Team',
    role: 'Owner',
    members: 5,
    description: '제품 전략, 릴리즈, QA 이슈를 관리하는 기본 워크스페이스입니다.',
    type: 'TEAM'
  },
  {
    id: 'ws-002',
    name: 'Research Pod',
    role: 'Member',
    members: 3,
    description: '고객 인터뷰, 리서치 회고, 인사이트 정리를 위한 워크스페이스입니다.',
    type: 'TEAM'
  },
  {
    id: 'ws-003',
    name: 'Design Ops',
    role: 'Member',
    members: 4,
    description: '디자인 리뷰와 화면 개선 논의를 기록하는 워크스페이스입니다.',
    type: 'TEAM'
  },
  {
    id: 'ws-004',
    name: 'Biz Ops',
    role: 'Member',
    members: 2,
    description: '파트너 미팅과 외부 협업 회의를 보관하는 워크스페이스입니다.',
    type: 'TEAM'
  }
];

export const seedMeetings = [
  {
    id: 'mtg-001',
    title: '주간 제품 회의',
    date: '2026-02-27T10:00:00+09:00',
    createdAt: '2026-02-27T09:50:00+09:00',
    status: 'COMPLETED',
    participants: ['민수', '지현', '영호'],
    workspaceId: 'ws-001',
    workspace: 'Product Team',
    sourceFileName: 'weekly-product-0227.m4a',
    summary:
      '신규 릴리즈 일정 확정, 온보딩 UX 개선안 승인, 알림 기능은 다음 스프린트로 이월. 회의 결과는 3월 첫째 주 배포 기준으로 정리되었다.',
    decisions: [
      '3월 첫째 주 릴리즈 범위는 온보딩 개선과 알림 설정 분리까지로 확정한다.',
      '사용자 인터뷰 결과를 반영해 첫 진입 안내 문구를 간소화한다.',
      '알림 기능 고도화는 다음 스프린트 백로그로 이관한다.'
    ],
    transcript:
      '민수: 이번 주 릴리즈 범위를 먼저 정리하겠습니다.\n지현: 온보딩 첫 화면은 문구가 많아서 이탈이 생깁니다.\n영호: QA 체크리스트는 배포 하루 전에 다시 확인하겠습니다.\n민수: 알림 기능은 다음 스프린트로 넘기고 현재 범위를 확정하죠.',
    todos: [
      { assignee: '민수', task: '릴리즈 노트 초안 작성', dueDate: '2026-03-03', done: false },
      { assignee: '지현', task: '온보딩 화면 시안 반영', dueDate: '2026-03-05', done: false },
      { assignee: '영호', task: 'QA 체크리스트 업데이트', dueDate: '2026-03-04', done: true }
    ],
    failureReason: '',
    mockFlow: null
  },
  {
    id: 'mtg-002',
    title: '고객 인터뷰 회고',
    date: '2026-02-28T14:00:00+09:00',
    createdAt: '2026-02-28T13:40:00+09:00',
    status: 'PROCESSING',
    participants: ['수연', '태훈'],
    workspaceId: 'ws-002',
    workspace: 'Research Pod',
    sourceFileName: 'customer-retrospective.m4a',
    summary: '전사 및 요약 처리 중입니다.',
    decisions: [],
    transcript: '',
    todos: [],
    failureReason: '',
    mockFlow: null
  },
  {
    id: 'mtg-003',
    title: '파트너사 킥오프',
    date: '2026-02-28T16:30:00+09:00',
    createdAt: '2026-02-28T16:00:00+09:00',
    status: 'FAILED',
    participants: ['Alex', '민수'],
    workspaceId: 'ws-004',
    workspace: 'Biz Ops',
    sourceFileName: 'partner-kickoff.m4a',
    summary: '전사 실패: 오디오 품질 이슈로 재처리 필요.',
    decisions: [],
    transcript: '',
    todos: [],
    failureReason: '오디오 품질 저하로 화자 분리가 되지 않았습니다.',
    mockFlow: null
  },
  {
    id: 'mtg-004',
    title: '신규 회의 초안',
    date: '2026-03-01T11:00:00+09:00',
    createdAt: '2026-03-01T10:58:00+09:00',
    status: 'CREATED',
    participants: ['지현', '영호', '수연'],
    workspaceId: 'ws-003',
    workspace: 'Design Ops',
    sourceFileName: '',
    summary: '회의 생성 후 업로드 대기 중입니다.',
    decisions: [],
    transcript: '',
    todos: [],
    failureReason: '',
    mockFlow: null
  },
  {
    id: 'mtg-005',
    title: '신규 미팅 업로드',
    date: '2026-03-01T17:30:00+09:00',
    createdAt: '2026-03-01T17:10:00+09:00',
    status: 'UPLOADED',
    participants: ['민수'],
    workspaceId: 'ws-001',
    workspace: 'Product Team',
    sourceFileName: 'new-upload.m4a',
    summary: '업로드 완료 후 AI 처리 대기 중입니다.',
    decisions: [],
    transcript: '',
    todos: [],
    failureReason: '',
    mockFlow: null
  },
  {
    id: 'mtg-006',
    title: '개인 아이디어 메모',
    date: '2026-03-02T09:30:00+09:00',
    createdAt: '2026-03-02T09:20:00+09:00',
    status: 'COMPLETED',
    participants: ['민수'],
    workspaceId: 'ws-personal-001',
    workspace: '민수의 개인 보관함',
    sourceFileName: 'personal-note.m4a',
    summary:
      '개인 음성 메모를 업로드해 핵심 아이디어와 다음 액션을 정리했다. 개인 회의나 아이디어 보관 목적의 업로드도 동일한 흐름으로 관리된다.',
    decisions: [
      '개인 메모 업로드도 워크스페이스 기반 구조 안에서 처리한다.',
      '개인 보관함은 1인용 워크스페이스처럼 동작한다.'
    ],
    transcript:
      '민수: 이번 주에 정리해야 할 아이디어를 먼저 기록합니다.\n민수: 로그인과 워크스페이스 흐름 이후에도 개인 업로드가 바로 가능해야 합니다.',
    todos: [
      { assignee: '민수', task: '개인 아이디어 정리본 문서화', dueDate: '2026-03-06', done: false }
    ],
    failureReason: '',
    mockFlow: null
  }
];
