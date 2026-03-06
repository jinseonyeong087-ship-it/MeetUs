import { getAccessToken, getCurrentSession } from './sessionApi.js';

const CURRENT_WORKSPACE_KEY = 'meetus-current-workspace';
const API_BASE_URL = window.__API_BASE_URL || '';

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
    const message = payload?.message || '워크스페이스 요청 중 오류가 발생했습니다.';
    throw new Error(message);
  }
  return payload;
}

function normalizeWorkspace(item = {}) {
  return {
    workspaceId: item.workspace_id || item.workspaceId || '',
    name: item.name || '이름 없는 워크스페이스',
    role: item.role || 'MEMBER'
  };
}

export async function getVisibleWorkspaces() {
  const payload = await request('/workspaces', { headers: getHeaders() });
  const items = Array.isArray(payload?.workspaces) ? payload.workspaces : [];
  return items.map(normalizeWorkspace);
}

export async function createWorkspace({ name }) {
  if (!name?.trim()) {
    throw new Error('워크스페이스 이름을 입력해주세요.');
  }

  const payload = await request('/workspaces', {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name: name.trim() })
  });

  return normalizeWorkspace({
    workspace_id: payload?.workspace_id,
    name: payload?.name,
    role: 'OWNER'
  });
}

export async function inviteUserToWorkspace(workspaceId, email) {
  if (!email?.trim()) {
    throw new Error('초대할 이메일을 입력해주세요.');
  }

  await request(`/workspaces/${encodeURIComponent(workspaceId)}/invite`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ email: email.trim() })
  });
}

export async function deleteWorkspace(workspaceId) {
  await request(`/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  const current = getCurrentWorkspace();
  if (current?.workspaceId === workspaceId) {
    window.localStorage.removeItem(CURRENT_WORKSPACE_KEY);
  }
}

export async function leaveWorkspace(workspaceId) {
  await request(`/workspaces/${encodeURIComponent(workspaceId)}/leave`, {
    method: 'POST',
    headers: getHeaders()
  });

  const current = getCurrentWorkspace();
  if (current?.workspaceId === workspaceId) {
    window.localStorage.removeItem(CURRENT_WORKSPACE_KEY);
  }
}

export function setCurrentWorkspace(workspace) {
  if (!workspace?.workspaceId) {
    throw new Error('선택할 워크스페이스 정보가 없습니다.');
  }
  window.localStorage.setItem(CURRENT_WORKSPACE_KEY, JSON.stringify(workspace));
  return workspace;
}

export function getCurrentWorkspace() {
  if (!getCurrentSession()?.user) {
    return null;
  }
  const raw = window.localStorage.getItem(CURRENT_WORKSPACE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function requireWorkspace() {
  const workspace = getCurrentWorkspace();
  if (!workspace) {
    window.location.href = './workspaces.html';
    throw new Error('워크스페이스 선택이 필요합니다.');
  }
  return workspace;
}
