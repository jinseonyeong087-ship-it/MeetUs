import { escapeHtml } from '../utils/format.js';

export function createTodoCard(todo) {
  const card = document.createElement('article');
  card.className = 'todo-card';

  card.innerHTML = `
    <div class="todo-card-head">
      <h4>${escapeHtml(todo.assignee)}</h4>
      <span class="badge ${todo.done ? 'todo-status-completed' : 'todo-status-open'}">${todo.done ? '완료' : '진행중'}</span>
    </div>
    <p>${escapeHtml(todo.task)}</p>
    <p class="muted">마감: ${escapeHtml(todo.dueDate || '미정')}</p>
  `;

  return card;
}
