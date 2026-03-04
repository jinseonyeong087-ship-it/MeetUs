import { seedMeetings } from './mockData.js';

const STORAGE_KEY = 'meetus-mock-meetings';
const NETWORK_DELAY_MS = 180;

function simulateDelay(payload) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(payload)), NETWORK_DELAY_MS);
  });
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

export function removeMeetingsByWorkspace(workspaceId) {
  const meetings = readStore().filter((meeting) => meeting.workspaceId !== workspaceId);
  writeStore(meetings);
}

function buildCompletedResult(title, participants) {
  const lead = participants[0] || '담당자';
  const secondary = participants[1] || lead;

  return {
    transcript: `${lead}: 오늘 회의의 주요 의제를 정리하겠습니다.\n${secondary}: 업로드와 결과 확인 흐름은 목업 기준으로 먼저 검증합니다.\n${lead}: API와 DB가 준비되면 동일한 UI를 실제 데이터에 연결합니다.`,
    summary: `${title} 회의 결과가 정리되었습니다. 핵심 이슈를 우선순위 기준으로 묶었고, 다음 액션은 담당자별로 분리했습니다. 구현 일정은 이번 주 안으로 확정하기로 했습니다.`,
    decisions: [
      `${title} 관련 우선순위 1순위 작업을 이번 주 내 확정한다.`,
      '회의 기록은 Archive에서 동일한 상태 체계로 조회한다.'
    ],
    actionItems: [
      { assignee: lead, task: '회의 결과 검토 및 공유', due_date: '2026-03-06' },
      { assignee: secondary, task: '화면 피드백 반영', due_date: '2026-03-07' }
    ]
  };
}

function getMockStageLabel(stage) {
  const map = {
    UPLOADED: 'UPLOADED',
    TRANSCRIBING: 'TRANSCRIBING',
    SUMMARIZING: 'SUMMARIZING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  };
  return map[stage] || stage;
}

function getMockStageDescription(stage, failureReason) {
  const map = {
    UPLOADED: '오디오 업로드가 완료되었습니다.',
    TRANSCRIBING: '음성을 텍스트로 변환하고 있습니다.',
    SUMMARIZING: 'AI Summary와 Action Items를 생성하고 있습니다.',
    COMPLETED: '요약과 To-Do가 준비되었습니다.',
    FAILED: failureReason || '처리 중 오류가 발생했습니다.'
  };
  return map[stage] || '';
}

function normalizeMeeting(raw) {
  return {
    meetingId: raw.meetingId,
    workspaceId: raw.workspaceId,
    title: raw.title,
    startedAt: raw.startedAt,
    createdAt: raw.createdAt,
    status: raw.status,
    displayStatus: raw.mockStage || raw.status,
    participants: raw.participants || [],
    sourceFileName: raw.audio?.fileName || '',
    objectKey: raw.audio?.objectKey || '',
    summary: raw.result?.summary || '',
    decisions: raw.result?.decisions || [],
    transcript: raw.result?.transcript || '',
    actionItems: raw.result?.actionItems || [],
    failureReason: raw.failureReason || null
  };
}

function resolveMockStatus(rawMeeting) {
  if (!rawMeeting.mockFlow) return rawMeeting;

  const now = Date.now();
  const nextMeeting = structuredClone(rawMeeting);
  const { uploadedAt, transcribingAt, summarizingAt, completedAt, shouldFail } = nextMeeting.mockFlow;

  if (uploadedAt && now >= uploadedAt) {
    nextMeeting.status = 'UPLOADED';
    nextMeeting.mockStage = 'UPLOADED';
  }

  if (transcribingAt && now >= transcribingAt) {
    nextMeeting.status = 'PROCESSING';
    nextMeeting.mockStage = 'TRANSCRIBING';
  }

  if (summarizingAt && now >= summarizingAt) {
    nextMeeting.status = 'PROCESSING';
    nextMeeting.mockStage = 'SUMMARIZING';
  }

  if (completedAt && now >= completedAt) {
    if (shouldFail) {
      nextMeeting.status = 'FAILED';
      nextMeeting.mockStage = 'FAILED';
      nextMeeting.failureReason = 'Mock 처리 중 오류가 발생했습니다.';
    } else {
      nextMeeting.status = 'COMPLETED';
      nextMeeting.mockStage = 'COMPLETED';
      nextMeeting.result = buildCompletedResult(nextMeeting.title, nextMeeting.participants);
      nextMeeting.failureReason = null;
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
      return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
    }
    if (sort === 'status') {
      return a.displayStatus.localeCompare(b.displayStatus);
    }
    return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
  });
  return sorted;
}

export async function getMeetings(filters = {}) {
  const meetings = reconcileMeetings().map(normalizeMeeting);
  const query = (filters.query || '').trim().toLowerCase();
  const status = filters.status || 'ALL';
  const sort = filters.sort || 'date-desc';
  const fromDate = filters.fromDate || '';
  const workspaceId = filters.workspaceId || '';

  const filtered = meetings.filter((meeting) => {
    const matchesQuery =
      !query ||
      meeting.title.toLowerCase().includes(query) ||
      meeting.participants.some((participant) => participant.toLowerCase().includes(query));
    const matchesStatus = status === 'ALL' || meeting.displayStatus === status;
    const matchesFromDate = !fromDate || meeting.startedAt.slice(0, 10) >= fromDate;
    const matchesWorkspace = !workspaceId || meeting.workspaceId === workspaceId;

    return matchesQuery && matchesStatus && matchesFromDate && matchesWorkspace;
  });

  return simulateDelay(sortMeetings(filtered, sort));
}

export async function getMeetingById(meetingId) {
  const meeting = reconcileMeetings().find((item) => item.meetingId === meetingId);
  if (!meeting) {
    throw new Error('회의를 찾을 수 없습니다.');
  }
  return simulateDelay(normalizeMeeting(meeting));
}

export async function createMockMeeting({ title, date, participants, fileName, workspaceId }) {
  const meetings = reconcileMeetings();
  const meetingId = `mtg_${Date.now()}`;
  const participantList = participants
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const meeting = {
    meetingId,
    workspaceId: workspaceId || 'ws_003',
    title: title.trim(),
    startedAt: date,
    createdAt: new Date().toISOString(),
    status: 'UPLOADED',
    participants: participantList.length ? participantList : ['미지정'],
    audio: {
      fileName,
      objectKey: `workspaces/ws_003/meetings/${meetingId}/audio/source.m4a`
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
  };

  writeStore([meeting, ...meetings]);
  return simulateDelay(normalizeMeeting(meeting));
}

export async function startMockUpload(meetingId) {
  const meetings = reconcileMeetings();
  const now = Date.now();

  const nextMeetings = meetings.map((meeting) => {
    if (meeting.meetingId !== meetingId) return meeting;
    return {
      ...meeting,
      mockStage: 'UPLOADED',
      mockFlow: {
        uploadedAt: now + 200,
        transcribingAt: now + 1400,
        summarizingAt: now + 3400,
        completedAt: now + 6200,
        shouldFail: false
      }
    };
  });

  writeStore(nextMeetings);
  return simulateDelay(normalizeMeeting(nextMeetings.find((meeting) => meeting.meetingId === meetingId)));
}

export async function retryMeetingProcessing(meetingId) {
  const meetings = reconcileMeetings();
  const now = Date.now();

  const nextMeetings = meetings.map((meeting) => {
    if (meeting.meetingId !== meetingId) return meeting;
    return {
      ...meeting,
      status: 'PROCESSING',
      mockStage: 'TRANSCRIBING',
      failureReason: null,
      mockFlow: {
        uploadedAt: now,
        transcribingAt: now + 300,
        summarizingAt: now + 1800,
        completedAt: now + 4200,
        shouldFail: false
      }
    };
  });

  writeStore(nextMeetings);
  return simulateDelay(normalizeMeeting(nextMeetings.find((meeting) => meeting.meetingId === meetingId)));
}

export function getDisplayStatusMeta(status) {
  return {
    label: getMockStageLabel(status),
    description: getMockStageDescription(status)
  };
}

export function resetMockMeetings() {
  writeStore(seedMeetings);
}
