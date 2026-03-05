import { getMeetings, resetMockMeetings } from '../api/meetingsApi.js';
import { logoutMock, requireSession } from '../api/sessionApi.js';
import { requireWorkspace } from '../api/workspaceApi.js';
import { createMeetingCard } from '../components/meetingCard.js';
import { mountUploadZone } from '../components/uploadZone.js';
import { initMobileSidebar } from '../utils/mobileSidebar.js';
import { initWorkspaceModal, initPersonalUpload, updateHeaderUserInfo, initGlobalSearch } from '../utils/common.js';

const meetingListEl = document.getElementById('meeting-list');
const emptyStateEl = document.getElementById('empty-state');
const reloadBtn = document.getElementById('reload-btn');
const resetBtn = document.getElementById('reset-btn');
const uploadRoot = document.getElementById('upload-root');
const meetingCountEl = document.getElementById('meeting-count');
const statusStatsEl = document.getElementById('status-stats');
const searchInputEl = document.getElementById('search-input');
const statusFilterEl = document.getElementById('status-filter');
const sortFilterEl = document.getElementById('sort-filter');
const logoutBtn = document.getElementById('logout-btn');

const session = requireSession();
const currentWorkspace = requireWorkspace();

mountUploadZone(uploadRoot, {
  workspace: currentWorkspace,
  onComplete(meeting) {
    window.location.href = `./meeting.html?id=${encodeURIComponent(meeting.meetingId)}`;
  }
});

// 헤더에서 사용자 이름 업데이트
const headerUserNameEl = document.querySelector('.header-user span');
if (headerUserNameEl && session.user) {
  headerUserNameEl.textContent = session.user.name;
}

logoutBtn.addEventListener('click', logoutMock);

function renderStats(meetings) {
  if (!statusStatsEl || !meetingCountEl) return;
  
  const statuses = ['CREATED', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'];
  statusStatsEl.innerHTML = '';
  meetingCountEl.textContent = `총 ${meetings.length}건`;

  statuses.forEach((status) => {
    const count = meetings.filter((m) => m.status === status).length;
    const item = document.createElement('div');
    item.className = `stat-card status-${status}`;
    item.innerHTML = `
      <p class="muted">${status}</p>
      <p class="stat-value">${count}</p>
    `;
    statusStatsEl.appendChild(item);
  });
}

function getFilters() {
  return {
    query: searchInputEl.value,
    status: statusFilterEl.value,
    sort: sortFilterEl.value,
    workspaceId: currentWorkspace.workspaceId
  };
}

async function renderMeetings() {
  meetingListEl.innerHTML = '';
  emptyStateEl.classList.add('hidden');

  try {
    const meetings = await getMeetings(getFilters());

    meetingCountEl.textContent = `총 ${meetings.length}건`;
    renderStats(await getMeetings({ workspaceId: currentWorkspace.workspaceId }));

    if (!meetings.length) {
      emptyStateEl.classList.remove('hidden');
      return;
    }

    meetings.forEach((meeting) => {
      meetingListEl.appendChild(createMeetingCard(meeting));
    });
  } catch (error) {
    emptyStateEl.textContent = `목록 로딩 실패: ${error.message}`;
    emptyStateEl.classList.remove('hidden');
  }
}

reloadBtn.addEventListener('click', renderMeetings);
resetBtn.addEventListener('click', async () => {
  resetMockMeetings();
  await renderMeetings();
});
searchInputEl.addEventListener('input', renderMeetings);
statusFilterEl.addEventListener('change', renderMeetings);
sortFilterEl.addEventListener('change', renderMeetings);

// 새로운 기능들 초기화
initMobileSidebar();
initWorkspaceModal();
initPersonalUpload();
updateHeaderUserInfo();
initGlobalSearch();

// URL 검색 파라미터 처리
const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get('search');
if (searchQuery && searchInputEl) {
  searchInputEl.value = searchQuery;
}

renderMeetings();
