import { seedWorkspaces } from './mockData.js';

const WORKSPACES_KEY = 'meetus-mock-workspaces';
const CURRENT_WORKSPACE_KEY = 'meetus-current-workspace';

function ensureWorkspaces() {
  const raw = window.localStorage.getItem(WORKSPACES_KEY);
  if (!raw) {
    window.localStorage.setItem(WORKSPACES_KEY, JSON.stringify(seedWorkspaces));
  }
}

export function getWorkspaces() {
  ensureWorkspaces();
  return JSON.parse(window.localStorage.getItem(WORKSPACES_KEY) || '[]');
}

export function createWorkspace({ name, description }) {
  if (!name?.trim()) {
    throw new Error('워크스페이스 이름을 입력해주세요.');
  }

  const workspaces = getWorkspaces();
  const workspace = {
    id: `ws-${Date.now()}`,
    name: name.trim(),
    role: 'Owner',
    members: 1,
    description: description?.trim() || '새로 생성된 워크스페이스입니다.',
    type: 'TEAM'
  };

  window.localStorage.setItem(WORKSPACES_KEY, JSON.stringify([workspace, ...workspaces]));
  setCurrentWorkspace(workspace.id);
  return workspace;
}

export function setCurrentWorkspace(id) {
  const workspace = getWorkspaces().find((item) => item.id === id);
  if (!workspace) {
    throw new Error('워크스페이스를 찾을 수 없습니다.');
  }
  window.localStorage.setItem(CURRENT_WORKSPACE_KEY, JSON.stringify(workspace));
  return workspace;
}

export function getCurrentWorkspace() {
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
