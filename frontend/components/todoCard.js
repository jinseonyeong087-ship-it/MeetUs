import { escapeHtml } from '../utils/format.js';

export function createTodoCard(todo) {
  const card = document.createElement('article');
  card.className = 'todo-card';

  card.innerHTML = `
    <h4>${escapeHtml(todo.assignee)}</h4>
    <p>${escapeHtml(todo.task)}</p>
    <p class="muted">마감: ${escapeHtml(todo.dueDate)}</p>
    <span class="badge ${todo.done ? 'todo-status-completed' : 'todo-status-open'}">${todo.done ? '완료' : '진행중'}</span>
  `;

  return card;
}
