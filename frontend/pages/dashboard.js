import { getMeetings, resetMockMeetings } from '../api/meetingsApi.js';
import { logoutMock, requireSession } from '../api/sessionApi.js';
import { requireWorkspace } from '../api/workspaceApi.js';
import { createMeetingCard } from '../components/meetingCard.js';
import { mountUploadZone } from '../components/uploadZone.js';
import { initMobileSidebar } from '../utils/mobileSidebar.js';

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
const sidebarWorkspaceNameEl = document.getElementById('sidebar-workspace-name');
const sidebarUserNameEl = document.getElementById('sidebar-user-name');
const logoutBtn = document.getElementById('logout-btn');

const session = requireSession();
const currentWorkspace = requireWorkspace();

mountUploadZone(uploadRoot, {
  workspace: currentWorkspace,
  onComplete(meeting) {
    window.location.href = `./meeting.html?id=${encodeURIComponent(meeting.id)}`;
  }
});
initMobileSidebar();
sidebarWorkspaceNameEl.textContent = currentWorkspace.name;
sidebarUserNameEl.textContent = `${session.user.name} · ${session.user.email}`;
logoutBtn.addEventListener('click', logoutMock);

function renderStats(meetings) {
  const statuses = ['CREATED', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'];
  statusStatsEl.innerHTML = '';

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
    workspaceId: currentWorkspace.id
  };
}

async function renderMeetings() {
  meetingListEl.innerHTML = '';
  emptyStateEl.classList.add('hidden');

  try {
    const meetings = await getMeetings(getFilters());

    meetingCountEl.textContent = `총 ${meetings.length}건`;
    renderStats(await getMeetings({ workspaceId: currentWorkspace.id }));

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

renderMeetings();
