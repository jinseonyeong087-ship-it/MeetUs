import { getCurrentSession, loginMock } from '../api/sessionApi.js';

const formEl = document.getElementById('login-form');
const emailInputEl = document.getElementById('email-input');
const passwordInputEl = document.getElementById('password-input');
const errorEl = document.getElementById('login-error');

const session = getCurrentSession();
if (session) {
  window.location.href = './workspaces.html';
}

formEl.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorEl.textContent = '';

  try {
    await loginMock({
      email: emailInputEl.value,
      password: passwordInputEl.value
    });
    window.location.href = './workspaces.html';
  } catch (error) {
    errorEl.textContent = error.message;
  }
});
