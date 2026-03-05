export const seedUser = {
  userId: 'usr_001',
  name: '민수',
  email: 'minsu@meetus.app'
};

export const seedAccounts = [
  {
    userId: 'usr_001',
    name: '민수',
    email: 'minsu@meetus.app',
    password: '1234'
  },
  {
    userId: 'usr_002',
    name: 'suyeon',
    email: 'suyeon@meetus.app',
    password: '1234'
  },
  {
    userId: 'usr_003',
    name: 'jihyun',
    email: 'jihyun@meetus.app',
    password: '1234'
  }
];

export const seedWorkspaces = [
  {
    workspaceId: 'ws_001',
    name: 'Product Team',
    role: 'OWNER',
    memberCount: 5,
    description: '제품 전략, 릴리즈, QA 이슈를 관리하는 기본 워크스페이스입니다.',
    ownerUserId: 'usr_001',
    memberUserIds: ['usr_001', 'usr_002', 'usr_003']
  },
  {
    workspaceId: 'ws_002',
    name: 'Research Pod',
    role: 'MEMBER',
    memberCount: 3,
    description: '고객 인터뷰와 인사이트 정리를 위한 리서치 워크스페이스입니다.',
    ownerUserId: 'usr_002',
    memberUserIds: ['usr_001', 'usr_002']
  },
  {
    workspaceId: 'ws_003',
    name: 'Personal Archive',
    role: 'OWNER',
    memberCount: 1,
    description: '개인 음성 메모와 인터뷰를 정리하는 1인용 아카이브입니다.',
    ownerUserId: 'usr_001',
    memberUserIds: ['usr_001']
  }
];

export const seedMeetings = [
  {
    meetingId: 'mtg_001',
    workspaceId: 'ws_001',
    title: '주간 제품 회의',
    startedAt: '2026-02-27T01:00:00Z',
    createdAt: '2026-02-27T00:50:00Z',
    status: 'COMPLETED',
    participants: ['민수', '지현', '영호'],
    audio: {
      fileName: 'weekly-product-0227.m4a',
      objectKey: 'workspaces/ws_001/meetings/mtg_001/audio/source.m4a'
    },
    result: {
      transcript:
        '민수: 이번 주 릴리즈 범위를 먼저 정리하겠습니다.\n지현: 온보딩 첫 화면은 문구가 많아서 이탈이 생깁니다.\n영호: QA 체크리스트는 배포 하루 전에 다시 확인하겠습니다.\n민수: 알림 기능은 다음 스프린트로 넘기고 현재 범위를 확정하죠.',
      summary:
        '신규 릴리즈 일정 확정, 온보딩 UX 개선안 승인, 알림 기능은 다음 스프린트로 이월. 회의 결과는 3월 첫째 주 배포 기준으로 정리되었다.',
      decisions: [
        '3월 첫째 주 릴리즈 범위는 온보딩 개선과 알림 설정 분리까지로 확정한다.',
        '첫 진입 안내 문구는 간결한 버전으로 교체한다.'
      ],
      actionItems: [
        { assignee: '민수', task: '릴리즈 노트 초안 작성', due_date: '2026-03-03' },
        { assignee: '지현', task: '온보딩 화면 시안 반영', due_date: '2026-03-05' },
        { assignee: '영호', task: 'QA 체크리스트 업데이트', due_date: '2026-03-04' }
      ]
    },
    mockStage: 'COMPLETED',
    failureReason: null,
    mockFlow: null
  },
  {
    meetingId: 'mtg_002',
    workspaceId: 'ws_002',
    title: '고객 인터뷰 회고',
    startedAt: '2026-02-28T05:00:00Z',
    createdAt: '2026-02-28T04:40:00Z',
    status: 'PROCESSING',
    participants: ['수연', '태훈'],
    audio: {
      fileName: 'customer-retrospective.m4a',
      objectKey: 'workspaces/ws_002/meetings/mtg_002/audio/source.m4a'
    },
    result: {
      transcript: '',
      summary: '',
      decisions: [],
      actionItems: []
    },
    mockStage: 'TRANSCRIBING',
    failureReason: null,
    mockFlow: null
  },
  {
    meetingId: 'mtg_003',
    workspaceId: 'ws_001',
    title: '디자인 QA 싱크',
    startedAt: '2026-03-02T04:00:00Z',
    createdAt: '2026-03-02T03:50:00Z',
    status: 'PROCESSING',
    participants: ['지현', '하린'],
    audio: {
      fileName: 'design-qa-sync.m4a',
      objectKey: 'workspaces/ws_001/meetings/mtg_003/audio/source.m4a'
    },
    result: {
      transcript: '',
      summary: '',
      decisions: [],
      actionItems: []
    },
    mockStage: 'SUMMARIZING',
    failureReason: null,
    mockFlow: null
  },
  {
    meetingId: 'mtg_004',
    workspaceId: 'ws_003',
    title: '개인 아이디어 메모',
    startedAt: '2026-03-02T00:30:00Z',
    createdAt: '2026-03-02T00:20:00Z',
    status: 'COMPLETED',
    participants: ['민수'],
    audio: {
      fileName: 'personal-note.m4a',
      objectKey: 'workspaces/ws_003/meetings/mtg_004/audio/source.m4a'
    },
    result: {
      transcript:
        '민수: 이번 주에 정리해야 할 아이디어를 먼저 기록합니다.\n민수: 로그인과 업로드 흐름 이후에도 개인 메모를 쉽게 남길 수 있어야 합니다.',
      summary:
        '개인 음성 메모를 업로드해 핵심 아이디어와 다음 액션을 정리했다. 개인 회의나 아이디어 보관 목적의 업로드도 동일한 흐름으로 관리된다.',
      decisions: [
        '개인 음성 메모도 동일한 AI 분석 흐름으로 처리한다.',
        '개인 메모는 Archive에서도 일반 회의와 동일하게 검색 가능해야 한다.'
      ],
      actionItems: [{ assignee: '민수', task: '아이디어 정리본 문서화', due_date: '2026-03-06' }]
    },
    mockStage: 'COMPLETED',
    failureReason: null,
    mockFlow: null
  },
  {
    meetingId: 'mtg_005',
    workspaceId: 'ws_001',
    title: '파트너사 킥오프',
    startedAt: '2026-02-28T07:30:00Z',
    createdAt: '2026-02-28T07:00:00Z',
    status: 'FAILED',
    participants: ['Alex', '민수'],
    audio: {
      fileName: 'partner-kickoff.m4a',
      objectKey: 'workspaces/ws_001/meetings/mtg_005/audio/source.m4a'
    },
    result: {
      transcript: '',
      summary: '',
      decisions: [],
      actionItems: []
    },
    mockStage: 'FAILED',
    failureReason: '오디오 품질 저하로 화자 분리가 되지 않았습니다.',
    mockFlow: null
  },
  {
    meetingId: 'mtg_006',
    workspaceId: 'ws_002',
    title: '신규 업로드 테스트',
    startedAt: '2026-03-03T02:00:00Z',
    createdAt: '2026-03-03T01:55:00Z',
    status: 'UPLOADED',
    participants: ['태훈'],
    audio: {
      fileName: 'new-upload.m4a',
      objectKey: 'workspaces/ws_002/meetings/mtg_006/audio/source.m4a'
    },
    result: {
      transcript: '',
      summary: '',
      decisions: [],
      actionItems: []
    },
    mockStage: 'UPLOADED',
    failureReason: null,
    mockFlow: null
  }
];
