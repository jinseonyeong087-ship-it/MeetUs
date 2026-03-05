import { logoutMock, requireSession } from '../api/sessionApi.js';
import {
  createWorkspace,
  deleteWorkspace,
  getCurrentWorkspace,
  getVisibleWorkspaces,
  inviteUserToWorkspace,
  leaveWorkspace,
  setCurrentWorkspace
} from '../api/workspaceApi.js';

const workspaceListEl = document.getElementById('workspace-list');
const workspaceCountEl = document.getElementById('workspace-count');
const workspacePaginationEl = document.getElementById('workspace-pagination');
const workspaceFormEl = document.getElementById('workspace-form');
const workspaceNameInputEl = document.getElementById('workspace-name-input');
const workspaceDescriptionInputEl = document.getElementById('workspace-description-input');
const workspaceErrorEl = document.getElementById('workspace-error');
const logoutBtn = document.getElementById('logout-btn');
const currentUserEl = document.getElementById('current-user');
const workspaceModalEl = document.getElementById('workspace-modal');
const openWorkspaceModalBtn = document.getElementById('open-workspace-modal-btn');
const closeWorkspaceModalBtn = document.getElementById('close-workspace-modal-btn');

const session = requireSession();
currentUserEl.textContent = `${session.user.userId} · ${session.user.email}`;
const params = new URLSearchParams(window.location.search);
const PAGE_SIZE = 5;
let currentPage = 1;

function openWorkspaceModal() {
  workspaceModalEl.classList.add('active');
  workspaceErrorEl.textContent = '';
  workspaceNameInputEl.focus();
}

function closeWorkspaceModal() {
  workspaceModalEl.classList.remove('active');
  workspaceFormEl.reset();
  workspaceErrorEl.textContent = '';
  if (params.get('modal') === 'create') {
    window.history.replaceState({}, '', './workspaces.html');
  }
}

function createPagination(totalItems, page, onChange) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  workspacePaginationEl.innerHTML = '';
  workspacePaginationEl.classList.toggle('hidden', totalPages <= 1);

  if (totalPages <= 1) {
    return;
  }

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn';
  prevBtn.type = 'button';
  prevBtn.textContent = '이전';
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener('click', () => onChange(page - 1));
  workspacePaginationEl.appendChild(prevBtn);

  for (let index = 1; index <= totalPages; index += 1) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `btn ${index === page ? 'btn-primary' : ''}`;
    pageBtn.type = 'button';
    pageBtn.textContent = String(index);
    pageBtn.addEventListener('click', () => onChange(index));
    workspacePaginationEl.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn';
  nextBtn.type = 'button';
  nextBtn.textContent = '다음';
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener('click', () => onChange(page + 1));
  workspacePaginationEl.appendChild(nextBtn);
}

function createWorkspaceCard(workspace) {
  const current = getCurrentWorkspace();
  const isCurrent = current?.workspaceId === workspace.workspaceId;
  const isOwner = workspace.ownerUserId === session.user.userId;
  const roleLabel = isOwner ? '소유자' : '멤버';
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="meeting-card-head">
      <div>
        <p class="eyebrow">${roleLabel}</p>
        <h3>${workspace.name}</h3>
      </div>
      <span class="badge ${isCurrent ? 'stage-COMPLETED' : 'stage-UPLOADED'}">${isCurrent ? '현재 선택' : '선택 가능'}</span>
    </div>
    <p class="muted" style="margin: 0 0 14px;">${workspace.description}</p>
    <p class="muted" style="margin: 0 0 14px;">멤버: ${workspace.memberUserIds.join(', ')}</p>
    <div class="meeting-card-foot">
      <span class="muted">${workspace.memberCount}명</span>
      <button class="btn ${isCurrent ? '' : 'btn-primary'}" type="button">${isCurrent ? '회의 보기' : '선택하기'}</button>
    </div>
    <div class="workspace-actions">
      ${isOwner ? '<button class="btn btn-danger" type="button" data-delete>워크스페이스 삭제</button>' : '<button class="btn" type="button" data-leave>워크스페이스 나가기</button>'}
    </div>
    ${isOwner ? `
      <div class="auth-form" style="margin-top: 16px;">
        <div class="field">
          <label for="invite-${workspace.workspaceId}">유저 ID 초대</label>
          <input id="invite-${workspace.workspaceId}" type="text" placeholder="예: usr_002" />
        </div>
        <button class="btn" type="button" data-invite="${workspace.workspaceId}">유저 초대</button>
      </div>
    ` : ''}
  `;

  card.querySelector('button').addEventListener('click', () => {
    setCurrentWorkspace(workspace.workspaceId);
    window.location.href = './index.html';
  });

  if (isOwner) {
    const inviteBtn = card.querySelector(`[data-invite="${workspace.workspaceId}"]`);
    const inviteInput = card.querySelector(`#invite-${workspace.workspaceId}`);
    const deleteBtn = card.querySelector('[data-delete]');
    inviteBtn.addEventListener('click', () => {
      try {
        inviteUserToWorkspace(workspace.workspaceId, inviteInput.value);
        inviteInput.value = '';
        renderWorkspaces();
      } catch (error) {
        workspaceErrorEl.textContent = error.message;
      }
    });
    deleteBtn.addEventListener('click', () => {
      if (!window.confirm('해당 워크스페이스와 회의 데이터를 삭제하시겠습니까?')) {
        return;
      }
      try {
        deleteWorkspace(workspace.workspaceId);
        renderWorkspaces();
      } catch (error) {
        workspaceErrorEl.textContent = error.message;
      }
    });
  } else {
    const leaveBtn = card.querySelector('[data-leave]');
    leaveBtn.addEventListener('click', () => {
      if (!window.confirm('이 워크스페이스에서 나가시겠습니까?')) {
        return;
      }
      try {
        leaveWorkspace(workspace.workspaceId);
        renderWorkspaces();
      } catch (error) {
        workspaceErrorEl.textContent = error.message;
      }
    });
  }

  return card;
}

function renderWorkspaces() {
  const workspaces = getVisibleWorkspaces();
  workspaceCountEl.textContent = `${workspaces.length}개 워크스페이스`;
  workspaceListEl.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(workspaces.length / PAGE_SIZE));
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  workspaces.slice(startIndex, startIndex + PAGE_SIZE).forEach((workspace) => workspaceListEl.appendChild(createWorkspaceCard(workspace)));
  createPagination(workspaces.length, currentPage, (page) => {
    currentPage = page;
    renderWorkspaces();
  });
}

workspaceFormEl.addEventListener('submit', (event) => {
  event.preventDefault();
  workspaceErrorEl.textContent = '';

  try {
    createWorkspace({
      name: workspaceNameInputEl.value,
      description: workspaceDescriptionInputEl.value
    });
    closeWorkspaceModal();
    window.location.href = './index.html';
  } catch (error) {
    workspaceErrorEl.textContent = error.message;
  }
});

logoutBtn.addEventListener('click', logoutMock);
openWorkspaceModalBtn.addEventListener('click', openWorkspaceModal);
closeWorkspaceModalBtn.addEventListener('click', closeWorkspaceModal);
workspaceModalEl.addEventListener('click', (event) => {
  if (event.target === workspaceModalEl) {
    closeWorkspaceModal();
  }
});

if (params.get('modal') === 'create') {
  openWorkspaceModal();
}

renderWorkspaces();
