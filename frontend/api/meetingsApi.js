import { seedMeetings } from './mockData.js';

const STORAGE_KEY = 'ai-minutes-mock-meetings';
const NETWORK_DELAY_MS = 180;

function simulateDelay(payload) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(payload)), NETWORK_DELAY_MS);
  });
}

function buildCompletedResult(title, participants) {
  const lead = participants[0] || '담당자';
  const secondary = participants[1] || lead;
  const reviewer = participants[2] || secondary;

  return {
    summary: `${title} 회의 결과가 정리되었습니다. 핵심 이슈를 우선순위 기준으로 묶었고, 다음 액션은 담당자별로 분리했습니다. 구현 일정은 이번 주 안으로 확정하기로 했습니다.`,
    decisions: [
      `${title} 관련 우선순위 1순위 작업을 이번 주 내 확정한다.`,
      '회의 기록은 Archive에서 동일 상태 체계로 조회한다.',
      '후속 액션은 담당자 기준 To-Do로 관리한다.'
    ],
    transcript: `${lead}: 오늘 회의의 주요 의제를 정리하겠습니다.\n${secondary}: 업로드와 결과 확인 흐름은 목업 기준으로 먼저 검증합니다.\n${reviewer}: API와 DB가 준비되면 동일 UI를 실제 데이터에 연결합니다.`,
    todos: [
      { assignee: lead, task: '회의 결과 검토 및 공유', dueDate: '2026-03-06', done: false },
      { assignee: secondary, task: '화면 피드백 반영', dueDate: '2026-03-07', done: false },
      { assignee: reviewer, task: 'QA 체크리스트 확인', dueDate: '2026-03-08', done: false }
    ]
  };
}

function ensureStorage() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMeetings));
  }
}

function readStore() {
  ensureStorage();
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
}

function writeStore(meetings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

function resolveMockStatus(meeting) {
  if (!meeting.mockFlow) return meeting;

  const now = Date.now();
  const nextMeeting = { ...meeting };
  const { uploadedAt, processingAt, completedAt, shouldFail } = meeting.mockFlow;

  if (uploadedAt && now >= uploadedAt) {
    nextMeeting.status = 'UPLOADED';
    nextMeeting.summary = '업로드가 완료되었습니다. 곧 AI 분석이 시작됩니다.';
  }

  if (processingAt && now >= processingAt) {
    nextMeeting.status = 'PROCESSING';
    nextMeeting.summary = '회의 내용을 분석 중입니다. 완료되면 결과가 자동으로 갱신됩니다.';
  }

  if (completedAt && now >= completedAt) {
    if (shouldFail) {
      nextMeeting.status = 'FAILED';
      nextMeeting.summary = 'AI 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
      nextMeeting.failureReason = 'Mock 처리 중 오류가 발생했습니다.';
    } else {
      nextMeeting.status = 'COMPLETED';
      nextMeeting.failureReason = '';
      Object.assign(nextMeeting, buildCompletedResult(nextMeeting.title, nextMeeting.participants));
    }
    nextMeeting.mockFlow = null;
  }

  return nextMeeting;
}

function reconcileMeetings() {
  const reconciled = readStore().map(resolveMockStatus);
  writeStore(reconciled);
  return reconciled;
}

function sortMeetings(meetings, sort = 'date-desc') {
  const sorted = [...meetings];
  sorted.sort((a, b) => {
    if (sort === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sort === 'status') {
      return a.status.localeCompare(b.status);
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  return sorted;
}

export async function getMeetings(filters = {}) {
  const meetings = reconcileMeetings();
  const query = (filters.query || '').trim().toLowerCase();
  const status = filters.status || 'ALL';
  const sort = filters.sort || 'date-desc';
  const workspaceId = filters.workspaceId || '';

  const filtered = meetings.filter((meeting) => {
    const matchesQuery =
      !query ||
      meeting.title.toLowerCase().includes(query) ||
      meeting.participants.some((participant) => participant.toLowerCase().includes(query));
    const matchesStatus = status === 'ALL' || meeting.status === status;
    const matchesWorkspace = !workspaceId || meeting.workspaceId === workspaceId;

    return matchesQuery && matchesStatus && matchesWorkspace;
  });

  return simulateDelay(sortMeetings(filtered, sort));
}

export async function getMeetingById(id) {
  const meeting = reconcileMeetings().find((item) => item.id === id);
  if (!meeting) {
    throw new Error('회의를 찾을 수 없습니다.');
  }
  return simulateDelay(meeting);
}

export async function createMockMeeting({ title, date, participants, fileName, workspaceId, workspaceName }) {
  const meetings = reconcileMeetings();
  const id = `mtg-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const participantList = participants
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const meeting = {
    id,
    title: title.trim(),
    date,
    createdAt,
    status: 'CREATED',
    participants: participantList.length ? participantList : ['미지정'],
    workspaceId: workspaceId || 'ws-mock',
    workspace: workspaceName || 'Mock Workspace',
    sourceFileName: fileName,
    summary: '회의가 생성되었습니다. 오디오 파일을 업로드해주세요.',
    decisions: [],
    transcript: '',
    todos: [],
    failureReason: '',
    mockFlow: null
  };

  writeStore([meeting, ...meetings]);
  return simulateDelay(meeting);
}

export async function startMockUpload(meetingId, options = {}) {
  const meetings = reconcileMeetings();
  const nextMeetings = meetings.map((meeting) => {
    if (meeting.id !== meetingId) return meeting;

    const now = Date.now();
    return {
      ...meeting,
      sourceFileName: options.fileName || meeting.sourceFileName,
      summary: '업로드를 시작했습니다. 완료 후 자동으로 AI 처리 단계로 전환됩니다.',
      mockFlow: {
        uploadedAt: now + 500,
        processingAt: now + 2200,
        completedAt: now + 6500,
        shouldFail: false
      }
    };
  });

  writeStore(nextMeetings);
  return simulateDelay(nextMeetings.find((meeting) => meeting.id === meetingId));
}

export async function retryMeetingProcessing(id) {
  const meetings = reconcileMeetings();
  const now = Date.now();

  const nextMeetings = meetings.map((meeting) => {
    if (meeting.id !== id) return meeting;

    return {
      ...meeting,
      status: 'PROCESSING',
      failureReason: '',
      summary: '재처리를 시작했습니다. 결과를 다시 생성하고 있습니다.',
      mockFlow: {
        uploadedAt: now,
        processingAt: now + 300,
        completedAt: now + 4200,
        shouldFail: false
      }
    };
  });

  writeStore(nextMeetings);
  return simulateDelay(nextMeetings.find((meeting) => meeting.id === id));
}

export function getStatusMeta(status) {
  const map = {
    CREATED: {
      label: '업로드 대기',
      description: '회의 메타데이터만 생성된 상태입니다.'
    },
    UPLOADED: {
      label: '업로드 완료',
      description: '오디오 업로드가 완료되었고 AI 분석 대기 중입니다.'
    },
    PROCESSING: {
      label: '분석 중',
      description: '전사, 요약, To-Do를 생성하고 있습니다.'
    },
    COMPLETED: {
      label: '분석 완료',
      description: '요약, 결정사항, To-Do 결과를 확인할 수 있습니다.'
    },
    FAILED: {
      label: '처리 실패',
      description: '재처리 또는 원인 확인이 필요한 상태입니다.'
    }
  };

  return map[status] || { label: status, description: '' };
}

export function resetMockMeetings() {
  writeStore(seedMeetings);
}
