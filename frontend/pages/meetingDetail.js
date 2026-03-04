import { getDisplayStatusMeta, getMeetingById, retryMeetingProcessing } from '../api/meetingsApi.js';
import { logoutMock, requireSession } from '../api/sessionApi.js';
import { requireWorkspace } from '../api/workspaceApi.js';
import { formatDateTime } from '../utils/format.js';

const titleEl = document.getElementById('meeting-title');
const metaEl = document.getElementById('meeting-meta');
const statusLabelEl = document.getElementById('status-label');
const statusDescriptionEl = document.getElementById('status-description');
const statusBannerEl = document.getElementById('status-banner');
const retryBtn = document.getElementById('retry-btn');
const refreshBtn = document.getElementById('refresh-btn');
const summaryEl = document.getElementById('summary-content');
const transcriptEl = document.getElementById('transcript-content');
const todoRootEl = document.getElementById('todo-root');
const decisionRootEl = document.getElementById('decision-root');
const toggleTranscriptBtn = document.getElementById('toggle-transcript-btn');
const copySummaryBtn = document.getElementById('copy-summary-btn');
const downloadSummaryBtn = document.getElementById('download-summary-btn');
const currentWorkspaceEl = document.getElementById('current-workspace');
const currentUserEl = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');

let meetingId = '';
let transcriptCollapsed = false;
let pollingTimer = null;
const session = requireSession();
const workspace = requireWorkspace();
currentWorkspaceEl.textContent = workspace.name;
currentUserEl.textContent = session.user.userId;
logoutBtn.addEventListener('click', logoutMock);

function groupTodosByPerson(todos = []) {
  return todos.reduce((acc, todo) => {
    const key = todo.assignee || '미지정';
    acc[key] = acc[key] || [];
    acc[key].push(todo);
    return acc;
  }, {});
}

function renderTranscript(transcript = '') {
  transcriptEl.innerHTML = '';

  if (!transcript || transcriptCollapsed) {
    transcriptEl.innerHTML = `<div class="empty-state">${transcriptCollapsed ? '전사 영역이 접혀 있습니다.' : '전사 결과가 아직 준비되지 않았습니다.'}</div>`;
    return;
  }

  transcript.split('\n').filter(Boolean).forEach((line) => {
    const [speaker, ...rest] = line.split(':');
    const item = document.createElement('article');
    item.className = 'transcript-item';
    item.innerHTML = `
      <div class="transcript-item-head">
        <strong>${speaker || 'Speaker'}</strong>
        <span class="badge stage-UPLOADED">화자</span>
      </div>
      <p>${rest.join(':').trim() || line}</p>
    `;
    transcriptEl.appendChild(item);
  });
}

function renderTodos(todos = []) {
  todoRootEl.innerHTML = '';

  if (!todos.length) {
    todoRootEl.innerHTML = '<div class="empty-state">추출된 Action Items가 없습니다.</div>';
    return;
  }

  const grouped = groupTodosByPerson(todos);
  Object.entries(grouped).forEach(([person, items]) => {
    const group = document.createElement('article');
    group.className = 'todo-group-card';
    const listHtml = items
      .map(
        (item) => `
          <article class="todo-item">
            <div class="todo-item-head">
              <h4>${person}</h4>
              <span class="badge stage-COMPLETED">${item.due_date ? item.due_date : '기한 없음'}</span>
            </div>
            <p>${item.task}</p>
          </article>
        `
      )
      .join('');

    group.innerHTML = `
      <div class="todo-group-title">
        <h4>${person}</h4>
        <span class="muted">${items.length}건</span>
      </div>
      <div class="todo-list">${listHtml}</div>
    `;
    todoRootEl.appendChild(group);
  });
}

function renderDecisions(decisions = []) {
  decisionRootEl.innerHTML = '';

  if (!decisions.length) {
    decisionRootEl.innerHTML = '<div class="empty-state">결정사항이 아직 준비되지 않았습니다.</div>';
    return;
  }

  decisions.forEach((decision, index) => {
    const item = document.createElement('article');
    item.className = 'todo-item';
    item.innerHTML = `
      <div class="todo-item-head">
        <h4>Decision ${index + 1}</h4>
        <span class="badge stage-UPLOADED">결정</span>
      </div>
      <p>${decision}</p>
    `;
    decisionRootEl.appendChild(item);
  });
}

function updateStatus(meeting) {
  const displayStatus = meeting.displayStatus || meeting.status;
  const statusMeta = getDisplayStatusMeta(displayStatus);
  statusLabelEl.textContent = statusMeta.label;
  statusDescriptionEl.textContent = statusMeta.description || meeting.summary;
  statusBannerEl.className = `card stage-${displayStatus}`;
  retryBtn.classList.toggle('hidden', displayStatus !== 'FAILED');
}

async function renderMeeting() {
  const meeting = await getMeetingById(meetingId);
  if (meeting.workspaceId !== workspace.workspaceId) {
    titleEl.textContent = '접근 불가';
    metaEl.textContent = '현재 선택한 워크스페이스의 회의만 조회할 수 있습니다.';
    stopPolling();
    return;
  }
  const displayStatus = meeting.displayStatus || meeting.status;

  titleEl.textContent = meeting.title;
  metaEl.textContent = `${formatDateTime(meeting.startedAt)} · ${displayStatus} · ${meeting.sourceFileName}`;
  summaryEl.textContent = meeting.summary || '요약이 아직 준비되지 않았습니다.';

  updateStatus(meeting);
  renderTranscript(meeting.transcript);
  renderDecisions(meeting.decisions);
  renderTodos(meeting.actionItems);

  if (['UPLOADED', 'TRANSCRIBING', 'SUMMARIZING'].includes(displayStatus)) {
    startPolling();
  } else {
    stopPolling();
  }
}

function startPolling() {
  if (pollingTimer) return;
  pollingTimer = window.setInterval(renderMeeting, 2500);
}

function stopPolling() {
  if (!pollingTimer) return;
  window.clearInterval(pollingTimer);
  pollingTimer = null;
}

toggleTranscriptBtn.addEventListener('click', async () => {
  transcriptCollapsed = !transcriptCollapsed;
  toggleTranscriptBtn.textContent = transcriptCollapsed ? '펼치기' : '접기';
  await renderMeeting();
});

copySummaryBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(summaryEl.textContent || '');
  copySummaryBtn.textContent = '복사 완료';
  window.setTimeout(() => {
    copySummaryBtn.textContent = '요약 복사';
  }, 1200);
});

downloadSummaryBtn.addEventListener('click', () => {
  const blob = new Blob([summaryEl.textContent || ''], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${meetingId}-summary.txt`;
  link.click();
  URL.revokeObjectURL(url);
});

retryBtn.addEventListener('click', async () => {
  await retryMeetingProcessing(meetingId);
  await renderMeeting();
});

refreshBtn.addEventListener('click', renderMeeting);

async function init() {
  const params = new URLSearchParams(window.location.search);
  meetingId = params.get('id') || '';

  if (!meetingId) {
    titleEl.textContent = '회의를 찾을 수 없습니다';
    metaEl.textContent = '유효한 회의 ID가 없습니다.';
    return;
  }

  await renderMeeting();
}

init();
