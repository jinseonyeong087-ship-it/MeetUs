import { getMeetings } from '../api/meetingsApi.js';
import { createMeetingCard } from '../components/meetingCard.js';
import { mountUploadZone } from '../components/uploadZone.js';
import { initMobileSidebar } from '../utils/mobileSidebar.js';

const meetingListEl = document.getElementById('meeting-list');
const emptyStateEl = document.getElementById('empty-state');
const reloadBtn = document.getElementById('reload-btn');
const uploadRoot = document.getElementById('upload-root');
const meetingCountEl = document.getElementById('meeting-count');
const statusStatsEl = document.getElementById('status-stats');

mountUploadZone(uploadRoot);
initMobileSidebar();

function renderStats(meetings) {
  const statuses = ['CREATED', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'];
  statusStatsEl.innerHTML = '';

  statuses.forEach((status) => {
    const count = meetings.filter((m) => m.status === status).length;
    const item = document.createElement('div');
    item.className = 'stat-card';
    item.innerHTML = `
      <p class="muted">${status}</p>
      <p class="stat-value">${count}</p>
    `;
    statusStatsEl.appendChild(item);
  });
}

async function renderMeetings() {
  meetingListEl.innerHTML = '';
  emptyStateEl.classList.add('hidden');

  try {
    const meetings = await getMeetings();

    meetingCountEl.textContent = `총 ${meetings.length}건`;
    renderStats(meetings);

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

renderMeetings();
