import { getMeetings, resetMockMeetings, getDisplayStatusMeta } from '../api/meetingsApi.js';
import { logoutMock, requireSession } from '../api/sessionApi.js';
import { requireWorkspace } from '../api/workspaceApi.js';
import { createMeetingCard } from '../components/meetingCard.js';

const metricsGridEl = document.getElementById('metrics-grid');
const recentMeetingsEl = document.getElementById('recent-meetings');
const latestSummaryEl = document.getElementById('latest-summary');
const currentWorkspaceEl = document.getElementById('current-workspace');
const currentUserEl = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');

const session = requireSession();
const workspace = requireWorkspace();
currentWorkspaceEl.textContent = workspace.name;
currentUserEl.textContent = session.user.userId;
logoutBtn.addEventListener('click', logoutMock);

function renderMetrics(meetings) {
  const statuses = ['UPLOADED', 'TRANSCRIBING', 'SUMMARIZING', 'COMPLETED'];
  metricsGridEl.innerHTML = '';

  statuses.forEach((status) => {
    const count = meetings.filter((meeting) => (meeting.displayStatus || meeting.status) === status).length;
    const meta = getDisplayStatusMeta(status);
    const card = document.createElement('article');
    card.className = 'metric-card';
    card.innerHTML = `
      <p class="eyebrow">${meta.label}</p>
      <p class="muted">${meta.description}</p>
      <strong>${count}</strong>
    `;
    metricsGridEl.appendChild(card);
  });
}

async function renderDashboard() {
  const meetings = await getMeetings({ sort: 'date-desc', workspaceId: workspace.workspaceId });
  renderMetrics(meetings);

  recentMeetingsEl.innerHTML = '';
  meetings.slice(0, 3).forEach((meeting) => {
    recentMeetingsEl.appendChild(createMeetingCard(meeting));
  });

  const latestCompleted = meetings.find((meeting) => (meeting.displayStatus || meeting.status) === 'COMPLETED');
  latestSummaryEl.textContent = latestCompleted
    ? latestCompleted.summary
    : '완료된 회의가 아직 없습니다.';
}

if (!window.localStorage.getItem('meetus-mock-meetings')) {
  resetMockMeetings();
}

renderDashboard();
