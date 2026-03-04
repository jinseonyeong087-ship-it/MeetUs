import { mountUploadZone } from '../components/uploadZone.js';
import { resetMockMeetings } from '../api/meetingsApi.js';
import { logoutMock, requireSession } from '../api/sessionApi.js';
import { requireWorkspace } from '../api/workspaceApi.js';

const uploadRoot = document.getElementById('upload-root');
const currentWorkspaceEl = document.getElementById('current-workspace');
const currentUserEl = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');

const session = requireSession();
const workspace = requireWorkspace();
currentWorkspaceEl.textContent = workspace.name;
currentUserEl.textContent = session.user.userId;
logoutBtn.addEventListener('click', logoutMock);

if (!window.localStorage.getItem('meetus-mock-meetings')) {
  resetMockMeetings();
}

mountUploadZone(uploadRoot, {
  workspace,
  onComplete(meeting) {
    window.location.href = `./meeting.html?id=${encodeURIComponent(meeting.meetingId)}`;
  }
});
