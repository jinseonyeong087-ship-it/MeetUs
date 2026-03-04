import { getMeetings, resetMockMeetings } from '../api/meetingsApi.js';
import { logoutMock, requireSession } from '../api/sessionApi.js';
import { requireWorkspace } from '../api/workspaceApi.js';
import { createMeetingCard } from '../components/meetingCard.js';

const meetingListEl = document.getElementById('meeting-list');
const emptyStateEl = document.getElementById('empty-state');
const searchInputEl = document.getElementById('search-input');
const dateFilterEl = document.getElementById('date-filter');
const statusFilterEl = document.getElementById('status-filter');
const sortFilterEl = document.getElementById('sort-filter');
const reloadBtn = document.getElementById('reload-btn');
const paginationEl = document.getElementById('meeting-pagination');
const currentWorkspaceEl = document.getElementById('current-workspace');
const currentUserEl = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');
const PAGE_SIZE = 5;
let currentPage = 1;

const session = requireSession();
const workspace = requireWorkspace();
currentWorkspaceEl.textContent = workspace.name;
currentUserEl.textContent = session.user.userId;
logoutBtn.addEventListener('click', logoutMock);

function getFilters() {
  return {
    query: searchInputEl.value,
    fromDate: dateFilterEl.value,
    status: statusFilterEl.value,
    sort: sortFilterEl.value,
    workspaceId: workspace.workspaceId
  };
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  paginationEl.innerHTML = '';
  paginationEl.classList.toggle('hidden', totalPages <= 1);

  if (totalPages <= 1) {
    return;
  }

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn';
  prevBtn.type = 'button';
  prevBtn.textContent = '이전';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    currentPage -= 1;
    renderMeetings();
  });
  paginationEl.appendChild(prevBtn);

  for (let index = 1; index <= totalPages; index += 1) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `btn ${index === currentPage ? 'btn-primary' : ''}`;
    pageBtn.type = 'button';
    pageBtn.textContent = String(index);
    pageBtn.addEventListener('click', () => {
      currentPage = index;
      renderMeetings();
    });
    paginationEl.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn';
  nextBtn.type = 'button';
  nextBtn.textContent = '다음';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    currentPage += 1;
    renderMeetings();
  });
  paginationEl.appendChild(nextBtn);
}

async function renderMeetings() {
  const meetings = await getMeetings(getFilters());
  const totalPages = Math.max(1, Math.ceil(meetings.length / PAGE_SIZE));
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleMeetings = meetings.slice(startIndex, startIndex + PAGE_SIZE);
  meetingListEl.innerHTML = '';
  emptyStateEl.classList.toggle('hidden', meetings.length > 0);

  visibleMeetings.forEach((meeting) => {
    meetingListEl.appendChild(createMeetingCard(meeting));
  });
  renderPagination(meetings.length);
}

function resetPageAndRender() {
  currentPage = 1;
  renderMeetings();
}

searchInputEl.addEventListener('input', resetPageAndRender);
dateFilterEl.addEventListener('change', resetPageAndRender);
statusFilterEl.addEventListener('change', resetPageAndRender);
sortFilterEl.addEventListener('change', resetPageAndRender);
reloadBtn.addEventListener('click', renderMeetings);

if (!window.localStorage.getItem('meetus-mock-meetings')) {
  resetMockMeetings();
}

renderMeetings();
