import { getAccessToken } from './sessionApi.js';

const API_BASE_URL = window.__API_BASE_URL || '';
const LOCAL_META_KEY = 'meetus-meeting-meta';

function readMeetingMeta() {
  return JSON.parse(window.localStorage.getItem(LOCAL_META_KEY) || '{}');
}

function writeMeetingMeta(meta) {
  window.localStorage.setItem(LOCAL_META_KEY, JSON.stringify(meta));
}

function getHeaders(extra = {}) {
  const token = getAccessToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = payload?.message || '회의 API 요청 중 오류가 발생했습니다.';
    throw new Error(message);
  }
  return payload;
}

function parseDecisions(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeMeeting(base, detail) {
  const metaMap = readMeetingMeta();
  const localMeta = metaMap[base.meeting_id] || {};
  const createdAt = base.created_at || new Date().toISOString();
  const todos = detail?.todos || [];

  return {
    meetingId: base.meeting_id,
    workspaceId: localMeta.workspaceId || '',
    title: base.title || '제목 없음',
    startedAt: localMeta.startedAt || createdAt,
    createdAt,
    status: base.status || 'CREATED',
    displayStatus: base.status || 'CREATED',
    participants: localMeta.participants || [],
    sourceFileName: localMeta.sourceFileName || '',
    objectKey: localMeta.objectKey || '',
    summary: detail?.summary || '',
    decisions: parseDecisions(detail?.decisions),
    transcript: detail?.transcript || '',
    actionItems: todos.map((todo) => ({
      todo_id: todo.todo_id,
      assignee: todo.assignee || '미지정',
      task: todo.task || '',
      status: todo.status || 'PENDING',
      due_date: todo.due_date || null
    })),
    failureReason: base.status === 'FAILED' ? '처리에 실패했습니다.' : null
  };
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
  const data = await request('/meetings', { headers: getHeaders() });
  const items = Array.isArray(data?.meetings) ? data.meetings : [];
  const meetings = items.map((item) => normalizeMeeting(item));

  const query = (filters.query || '').trim().toLowerCase();
  const status = filters.status || 'ALL';
  const fromDate = filters.fromDate || '';
  const workspaceId = filters.workspaceId || '';
  const filtered = meetings.filter((meeting) => {
    const matchesQuery = !query || meeting.title.toLowerCase().includes(query);
    const matchesStatus = status === 'ALL' || meeting.displayStatus === status;
    const matchesFromDate = !fromDate || meeting.startedAt.slice(0, 10) >= fromDate;
    const matchesWorkspace = !workspaceId || !meeting.workspaceId || meeting.workspaceId === workspaceId;
    return matchesQuery && matchesStatus && matchesFromDate && matchesWorkspace;
  });

  return sortMeetings(filtered, filters.sort || 'date-desc');
}

export async function getMeetingById(meetingId) {
  const data = await request(`/meetings/${encodeURIComponent(meetingId)}`, {
    headers: getHeaders()
  });
  const base = data?.meeting || {};
  return normalizeMeeting(
    {
      meeting_id: base.meeting_id || meetingId,
      title: base.title,
      status: base.status,
      created_at: base.created_at
    },
    data
  );
}

export async function createMockMeeting({ title, date, participants, fileName, workspaceId }) {
  const payload = await request('/meetings', {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title: title.trim() })
  });

  const meetingId = payload?.meeting_id;
  if (!meetingId) {
    throw new Error('회의 생성 응답이 올바르지 않습니다.');
  }

  const meta = readMeetingMeta();
  meta[meetingId] = {
    startedAt: date || new Date().toISOString(),
    participants: (participants || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    sourceFileName: fileName || '',
    workspaceId: workspaceId || ''
  };
  writeMeetingMeta(meta);

  return {
    meetingId,
    status: payload.status || 'CREATED'
  };
}

export async function startMockUpload(meetingId, { file } = {}) {
  if (!file) {
    throw new Error('업로드할 파일이 필요합니다.');
  }

  const uploadPayload = await request(
    `/meetings/${encodeURIComponent(meetingId)}/upload-url`,
    {
      method: 'POST',
      headers: getHeaders()
    }
  );

  const uploadUrl = uploadPayload?.upload_url;
  const audioKey = uploadPayload?.audio_key;
  if (!uploadUrl || !audioKey) {
    throw new Error('업로드 URL 발급 응답이 올바르지 않습니다.');
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'audio/mp4'
    },
    body: file
  });
  if (!uploadResponse.ok) {
    throw new Error('S3 업로드에 실패했습니다.');
  }

  await request(`/meetings/${encodeURIComponent(meetingId)}/upload-complete`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ audio_s3_key: audioKey })
  });

  await request(`/meetings/${encodeURIComponent(meetingId)}/process`, {
    method: 'POST',
    headers: getHeaders()
  });

  const meta = readMeetingMeta();
  meta[meetingId] = {
    ...(meta[meetingId] || {}),
    objectKey: audioKey
  };
  writeMeetingMeta(meta);

  return getMeetingById(meetingId);
}

export async function retryMeetingProcessing(meetingId) {
  await request(`/meetings/${encodeURIComponent(meetingId)}/process`, {
    method: 'POST',
    headers: getHeaders()
  });
  return getMeetingById(meetingId);
}

export function getDisplayStatusMeta(status) {
  const map = {
    CREATED: {
      label: 'CREATED',
      description: '회의 메타데이터가 생성되었습니다.'
    },
    UPLOADED: {
      label: 'UPLOADED',
      description: '오디오 업로드가 완료되었습니다.'
    },
    PROCESSING: {
      label: 'PROCESSING',
      description: '전사/요약 처리를 진행하고 있습니다.'
    },
    COMPLETED: {
      label: 'COMPLETED',
      description: '요약과 To-Do 생성이 완료되었습니다.'
    },
    FAILED: {
      label: 'FAILED',
      description: '처리에 실패했습니다. 재시도 후 다시 확인해주세요.'
    }
  };
  return map[status] || { label: status, description: '' };
}

export function removeMeetingsByWorkspace() {
  // TA api-spec에는 워크스페이스 삭제 API가 없어서 프론트에서 별도 처리하지 않는다.
}

export function resetMockMeetings() {
  // TA api-spec 기반으로 실제 API를 사용하므로 mock reset은 no-op 처리.
}
