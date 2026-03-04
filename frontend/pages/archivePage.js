import { getMeetings, resetMockMeetings } from '../api/meetingsApi.js';
import { logoutMock, requireSession } from '../api/sessionApi.js';
import { requireWorkspace } from '../api/workspaceApi.js';
import { createMeetingCard } from '../components/meetingCard.js';

const archiveListEl = document.getElementById('archive-list');
const emptyStateEl = document.getElementById('empty-state');
const searchInputEl = document.getElementById('search-input');
const dateFilterEl = document.getElementById('date-filter');
const sortFilterEl = document.getElementById('sort-filter');
const paginationEl = document.getElementById('archive-pagination');
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
    renderArchive();
  });
  paginationEl.appendChild(prevBtn);

  for (let index = 1; index <= totalPages; index += 1) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `btn ${index === currentPage ? 'btn-primary' : ''}`;
    pageBtn.type = 'button';
    pageBtn.textContent = String(index);
    pageBtn.addEventListener('click', () => {
      currentPage = index;
      renderArchive();
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
    renderArchive();
  });
  paginationEl.appendChild(nextBtn);
}

async function renderArchive() {
  const meetings = await getMeetings(getFilters());
  const archived = meetings.filter((meeting) => ['COMPLETED', 'FAILED'].includes(meeting.displayStatus || meeting.status));
  const totalPages = Math.max(1, Math.ceil(archived.length / PAGE_SIZE));
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleMeetings = archived.slice(startIndex, startIndex + PAGE_SIZE);

  archiveListEl.innerHTML = '';
  emptyStateEl.classList.toggle('hidden', archived.length > 0);

  visibleMeetings.forEach((meeting) => {
    archiveListEl.appendChild(createMeetingCard(meeting));
  });
  renderPagination(archived.length);
}

function resetPageAndRender() {
  currentPage = 1;
  renderArchive();
}

searchInputEl.addEventListener('input', resetPageAndRender);
dateFilterEl.addEventListener('change', resetPageAndRender);
sortFilterEl.addEventListener('change', resetPageAndRender);

if (!window.localStorage.getItem('meetus-mock-meetings')) {
  resetMockMeetings();
}

renderArchive();
