import { getMeetingById, getStatusMeta, retryMeetingProcessing } from '../api/meetingsApi.js';
import { logoutMock, requireSession } from '../api/sessionApi.js';
import { getCurrentWorkspace, requireWorkspace } from '../api/workspaceApi.js';
import { createTodoCard } from '../components/todoCard.js';
import { formatDateTime } from '../utils/format.js';
import { initMobileSidebar } from '../utils/mobileSidebar.js';

const titleEl = document.getElementById('meeting-title');
const metaEl = document.getElementById('meeting-meta');
const summaryEl = document.getElementById('summary-content');
const todoRootEl = document.getElementById('todo-root');
const decisionListEl = document.getElementById('decision-list');
const transcriptEl = document.getElementById('transcript-content');
const sourceFileEl = document.getElementById('source-file');
const workspaceNameEl = document.getElementById('workspace-name');
const failureReasonEl = document.getElementById('failure-reason');
const statusLabelEl = document.getElementById('status-label');
const statusDescriptionEl = document.getElementById('status-description');
const statusBannerEl = document.getElementById('status-banner');
const refreshBtn = document.getElementById('refresh-btn');
const retryBtn = document.getElementById('retry-btn');
const sidebarWorkspaceNameEl = document.getElementById('sidebar-workspace-name');
const sidebarUserNameEl = document.getElementById('sidebar-user-name');
const logoutBtn = document.getElementById('logout-btn');

let pollingTimer = null;
let meetingId = '';

const session = requireSession();
const currentWorkspace = requireWorkspace();

initMobileSidebar();
sidebarWorkspaceNameEl.textContent = currentWorkspace.name;
sidebarUserNameEl.textContent = `${session.user.name} · ${session.user.email}`;
logoutBtn.addEventListener('click', logoutMock);

function renderDecisions(decisions) {
  decisionListEl.innerHTML = '';

  if (!decisions?.length) {
    decisionListEl.innerHTML = '<li class="muted">결정사항이 아직 없습니다.</li>';
    return;
  }

  decisions.forEach((decision) => {
    const item = document.createElement('li');
    item.textContent = decision;
    decisionListEl.appendChild(item);
  });
}

function renderTodos(todos) {
  todoRootEl.innerHTML = '';

  if (!todos?.length) {
    todoRootEl.innerHTML = '<p class="muted">추출된 To-Do가 없습니다.</p>';
    return;
  }

  todos.forEach((todo) => {
    todoRootEl.appendChild(createTodoCard(todo));
  });
}

function renderStatus(meeting) {
  const statusMeta = getStatusMeta(meeting.status);
  statusLabelEl.textContent = statusMeta.label;
  statusDescriptionEl.textContent = statusMeta.description || meeting.summary;
  statusBannerEl.className = `status-banner status-${meeting.status}`;
  retryBtn.classList.toggle('hidden', meeting.status !== 'FAILED');
}

async function renderMeeting() {
  if (!meetingId) return;

  try {
    const meeting = await getMeetingById(meetingId);

    if (getCurrentWorkspace()?.id && meeting.workspaceId !== getCurrentWorkspace().id) {
      titleEl.textContent = '접근 제한';
      summaryEl.textContent = '현재 선택한 워크스페이스에 속한 회의만 조회할 수 있습니다.';
      return;
    }

    titleEl.textContent = meeting.title;
    metaEl.textContent = `${formatDateTime(meeting.date)} · 상태: ${meeting.status}`;
    summaryEl.textContent = meeting.summary || '요약이 아직 없습니다.';
    transcriptEl.textContent = meeting.transcript || 'transcript가 아직 준비되지 않았습니다.';
    sourceFileEl.textContent = meeting.sourceFileName || '업로드 전';
    workspaceNameEl.textContent = meeting.workspace || 'Mock Workspace';
    failureReasonEl.textContent = meeting.failureReason || '없음';

    renderStatus(meeting);
    renderDecisions(meeting.decisions);
    renderTodos(meeting.todos);

    if (meeting.status === 'PROCESSING' || meeting.status === 'UPLOADED' || meeting.status === 'CREATED') {
      startPolling();
    } else {
      stopPolling();
    }
  } catch (error) {
    stopPolling();
    titleEl.textContent = '로딩 실패';
    summaryEl.textContent = error.message;
  }
}

function stopPolling() {
  window.clearInterval(pollingTimer);
  pollingTimer = null;
}

function startPolling() {
  if (pollingTimer) return;
  pollingTimer = window.setInterval(renderMeeting, 2500);
}

retryBtn.addEventListener('click', async () => {
  retryBtn.disabled = true;
  await retryMeetingProcessing(meetingId);
  retryBtn.disabled = false;
  await renderMeeting();
});

refreshBtn.addEventListener('click', renderMeeting);

async function init() {
  const params = new URLSearchParams(window.location.search);
  meetingId = params.get('id') || '';

  if (!meetingId) {
    titleEl.textContent = '잘못된 접근';
    summaryEl.textContent = '회의 ID가 없습니다.';
    return;
  }

  await renderMeeting();
}

init();
