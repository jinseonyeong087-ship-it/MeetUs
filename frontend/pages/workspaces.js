import { logoutMock, requireSession } from '../api/sessionApi.js';
import { createWorkspace, getCurrentWorkspace, getWorkspaces, setCurrentWorkspace } from '../api/workspaceApi.js';
import { initMobileSidebar } from '../utils/mobileSidebar.js';
import { initWorkspaceModal, updateHeaderUserInfo, initGlobalSearch } from '../utils/common.js';

const workspaceListEl = document.getElementById('workspace-list');
const workspaceCountEl = document.getElementById('workspace-count');
const formEl = document.getElementById('workspace-form');
const nameInputEl = document.getElementById('workspace-name-input');
const descriptionInputEl = document.getElementById('workspace-description-input');
const errorEl = document.getElementById('workspace-error');
const logoutBtn = document.getElementById('logout-btn');

const session = requireSession();

// 헤더에서 사용자 이름 업데이트
const headerUserName = document.getElementById('header-user-name');
if (headerUserName && session.user) {
  headerUserName.textContent = session.user.name;
}

function createWorkspaceCard(workspace) {
  const current = getCurrentWorkspace();
  const article = document.createElement('article');
  article.className = 'workspace-card';
  const isCurrent = current?.id === workspace.id;
  const workspaceTypeLabel = workspace.type === 'PERSONAL' ? 'Personal Workspace' : workspace.role;

  article.innerHTML = `
    <div class="meeting-item-head">
      <div>
        <p class="eyebrow">${workspaceTypeLabel}</p>
        <h3>${workspace.name}</h3>
      </div>
      <span class="badge ${isCurrent ? 'status-COMPLETED' : 'status-UPLOADED'}">${isCurrent ? '현재 선택' : '선택 가능'}</span>
    </div>
    <p class="muted">${workspace.description}</p>
    <div class="meeting-item-foot">
      <span class="muted">멤버 ${workspace.members}명</span>
      <button class="btn" type="button">${isCurrent ? 'Archive로 이동' : '워크스페이스 선택'}</button>
    </div>
  `;

  const button = article.querySelector('button');
  button.addEventListener('click', () => {
    setCurrentWorkspace(workspace.id);
    window.location.href = './index.html';
  });

  return article;
}

function renderWorkspaces() {
  const workspaces = getWorkspaces();
  workspaceListEl.innerHTML = '';
  workspaceCountEl.textContent = `${workspaces.length}개`;

  workspaces.forEach((workspace) => {
    workspaceListEl.appendChild(createWorkspaceCard(workspace));
  });
}

formEl.addEventListener('submit', (event) => {
  event.preventDefault();
  errorEl.textContent = '';

  try {
    createWorkspace({
      name: nameInputEl.value,
      description: descriptionInputEl.value
    });
    window.location.href = './index.html';
  } catch (error) {
    errorEl.textContent = error.message;
  }
});

logoutBtn.addEventListener('click', logoutMock);

// 새로운 기능듡 초기화
initMobileSidebar();
initWorkspaceModal();
updateHeaderUserInfo();
initGlobalSearch();

// 워크스페이스 리스트 새로고침 함수를 전역으로 노출
window.refreshWorkspaceList = renderWorkspaces;

renderWorkspaces();
