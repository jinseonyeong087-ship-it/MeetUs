import { getStatusMeta } from '../api/meetingsApi.js';
import { formatDateTime, escapeHtml } from '../utils/format.js';

export function createMeetingCard(meeting) {
  const article = document.createElement('article');
  const statusMeta = getStatusMeta(meeting.status);
  const preview =
    meeting.status === 'COMPLETED'
      ? meeting.summary
      : statusMeta.description || meeting.summary || '상태 정보를 확인해주세요.';

  article.className = 'meeting-item';

  article.innerHTML = `
    <div class="meeting-item-head">
      <div>
        <p class="eyebrow">${escapeHtml(meeting.workspace || 'Workspace')}</p>
        <h3>${escapeHtml(meeting.title)}</h3>
      </div>
      <span class="badge status-${meeting.status}">${statusMeta.label}</span>
    </div>
    <p class="muted">${formatDateTime(meeting.date)}</p>
    <p class="muted">참여자: ${meeting.participants.map(escapeHtml).join(', ')}</p>
    <p class="meeting-preview">${escapeHtml(preview)}</p>
    <div class="meeting-item-foot">
      <span class="muted">${escapeHtml(meeting.sourceFileName || '파일 미등록')}</span>
      <a class="link" href="./meeting.html?id=${encodeURIComponent(meeting.id)}">상세 보기</a>
    </div>
  `;

  return article;
}
