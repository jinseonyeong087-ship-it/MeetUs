import { seedWorkspaces } from './mockData.js';
import { getCurrentSession } from './sessionApi.js';
import { removeMeetingsByWorkspace } from './meetingsApi.js';

const WORKSPACES_KEY = 'meetus-mock-workspaces';
const CURRENT_WORKSPACE_KEY = 'meetus-current-workspace';

function normalizeWorkspace(workspace) {
  const ownerUserId = workspace.ownerUserId || 'usr_001';
  const memberUserIds = workspace.memberUserIds || [ownerUserId];
  return {
    ...workspace,
    ownerUserId,
    memberUserIds,
    memberCount: memberUserIds.length
  };
}

function ensureWorkspaces() {
  const raw = window.localStorage.getItem(WORKSPACES_KEY);
  if (!raw) {
    window.localStorage.setItem(WORKSPACES_KEY, JSON.stringify(seedWorkspaces.map(normalizeWorkspace)));
    return;
  }

  const parsed = JSON.parse(raw).map(normalizeWorkspace);
  window.localStorage.setItem(WORKSPACES_KEY, JSON.stringify(parsed));
}

function getAllWorkspaces() {
  ensureWorkspaces();
  return JSON.parse(window.localStorage.getItem(WORKSPACES_KEY) || '[]').map(normalizeWorkspace);
}

function saveWorkspaces(workspaces) {
  window.localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces.map(normalizeWorkspace)));
}

function ensurePersonalWorkspace(userId) {
  const current = getAllWorkspaces();
  if (current.some((workspace) => workspace.memberUserIds.includes(userId))) {
    return;
  }

  const personal = normalizeWorkspace({
    workspaceId: `ws_${userId.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name: 'Personal Workspace',
    description: 'TA API에 워크스페이스 엔드포인트가 없어 기본 워크스페이스를 사용합니다.',
    ownerUserId: userId,
    memberUserIds: [userId]
  });

  saveWorkspaces([personal, ...current]);
}

function syncCurrentWorkspace(userId) {
  ensurePersonalWorkspace(userId);
  const visible = getAllWorkspaces().filter((workspace) => workspace.memberUserIds.includes(userId));
  const rawCurrent = window.localStorage.getItem(CURRENT_WORKSPACE_KEY);
  const current = rawCurrent ? JSON.parse(rawCurrent) : null;

  if (current && visible.some((workspace) => workspace.workspaceId === current.workspaceId)) {
    const nextCurrent = visible.find((workspace) => workspace.workspaceId === current.workspaceId);
    window.localStorage.setItem(CURRENT_WORKSPACE_KEY, JSON.stringify(nextCurrent));
    return nextCurrent;
  }

  if (visible.length > 0) {
    window.localStorage.setItem(CURRENT_WORKSPACE_KEY, JSON.stringify(visible[0]));
    return visible[0];
  }

  window.localStorage.removeItem(CURRENT_WORKSPACE_KEY);
  return null;
}

export function getVisibleWorkspaces() {
  const session = getCurrentSession();
  if (!session?.user?.userId) return [];
  const userId = session.user.userId;
  ensurePersonalWorkspace(userId);
  return getAllWorkspaces()
    .filter((workspace) => workspace.memberUserIds.includes(userId))
    .map((workspace) => ({
      ...workspace,
      role: workspace.ownerUserId === userId ? 'OWNER' : 'MEMBER'
    }));
}

export function createWorkspace({ name, description }) {
  const session = getCurrentSession();
  const ownerUserId = session?.user?.userId;

  if (!ownerUserId) {
    throw new Error('로그인이 필요합니다.');
  }
  if (!name?.trim()) {
    throw new Error('워크스페이스 이름을 입력해주세요.');
  }

  const workspace = normalizeWorkspace({
    workspaceId: `ws_${Date.now()}`,
    name: name.trim(),
    role: 'OWNER',
    memberCount: 1,
    description: description?.trim() || '새로 생성된 워크스페이스입니다.',
    ownerUserId,
    memberUserIds: [ownerUserId]
  });

  const workspaces = [workspace, ...getAllWorkspaces()];
  saveWorkspaces(workspaces);
  setCurrentWorkspace(workspace.workspaceId);
  return workspace;
}

export function inviteUserToWorkspace(workspaceId, invitedUserId) {
  const session = getCurrentSession();
  const currentUserId = session?.user?.userId;

  if (!currentUserId) {
    throw new Error('로그인이 필요합니다.');
  }
  if (!invitedUserId?.trim()) {
    throw new Error('초대할 유저 ID를 입력해주세요.');
  }

  const workspaces = getAllWorkspaces().map((workspace) => {
    if (workspace.workspaceId !== workspaceId) return workspace;
    if (workspace.ownerUserId !== currentUserId) {
      throw new Error('워크스페이스 소유자만 초대할 수 있습니다.');
    }
    if (workspace.memberUserIds.includes(invitedUserId.trim())) {
      return workspace;
    }
    return normalizeWorkspace({
      ...workspace,
      memberUserIds: [...workspace.memberUserIds, invitedUserId.trim()],
      memberCount: workspace.memberUserIds.length + 1
    });
  });

  saveWorkspaces(workspaces);
}

export function deleteWorkspace(workspaceId) {
  const session = getCurrentSession();
  const currentUserId = session?.user?.userId;

  if (!currentUserId) {
    throw new Error('로그인이 필요합니다.');
  }

  const target = getAllWorkspaces().find((workspace) => workspace.workspaceId === workspaceId);
  if (!target) {
    throw new Error('워크스페이스를 찾을 수 없습니다.');
  }
  if (target.ownerUserId !== currentUserId) {
    throw new Error('워크스페이스 소유자만 삭제할 수 있습니다.');
  }

  const workspaces = getAllWorkspaces().filter((workspace) => workspace.workspaceId !== workspaceId);
  saveWorkspaces(workspaces);
  removeMeetingsByWorkspace(workspaceId);
  syncCurrentWorkspace(currentUserId);
}

export function leaveWorkspace(workspaceId) {
  const session = getCurrentSession();
  const currentUserId = session?.user?.userId;

  if (!currentUserId) {
    throw new Error('로그인이 필요합니다.');
  }

  const target = getAllWorkspaces().find((workspace) => workspace.workspaceId === workspaceId);
  if (!target) {
    throw new Error('워크스페이스를 찾을 수 없습니다.');
  }
  if (target.ownerUserId === currentUserId) {
    throw new Error('소유자는 워크스페이스를 나갈 수 없습니다. 삭제를 사용해주세요.');
  }

  const workspaces = getAllWorkspaces().map((workspace) => {
    if (workspace.workspaceId !== workspaceId) return workspace;
    return normalizeWorkspace({
      ...workspace,
      memberUserIds: workspace.memberUserIds.filter((memberUserId) => memberUserId !== currentUserId),
      memberCount: workspace.memberUserIds.filter((memberUserId) => memberUserId !== currentUserId).length
    });
  });

  saveWorkspaces(workspaces);
  syncCurrentWorkspace(currentUserId);
}

export function setCurrentWorkspace(workspaceId) {
  const workspace = getVisibleWorkspaces().find((item) => item.workspaceId === workspaceId);
  if (!workspace) {
    throw new Error('접근 가능한 워크스페이스를 찾을 수 없습니다.');
  }
  window.localStorage.setItem(CURRENT_WORKSPACE_KEY, JSON.stringify(workspace));
  return workspace;
}

export function getCurrentWorkspace() {
  const session = getCurrentSession();
  if (!session?.user?.userId) {
    return null;
  }
  return syncCurrentWorkspace(session.user.userId);
}

export function requireWorkspace() {
  const workspace = getCurrentWorkspace();
  const visible = getVisibleWorkspaces();
  if (!workspace || !visible.some((item) => item.workspaceId === workspace.workspaceId)) {
    window.location.href = './workspaces.html';
    throw new Error('워크스페이스 선택이 필요합니다.');
  }
  return workspace;
}
