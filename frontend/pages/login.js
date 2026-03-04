import { getCurrentSession, loginMock, signupMock } from '../api/sessionApi.js';

const loginSectionEl = document.getElementById('login-section');
const signupSectionEl = document.getElementById('signup-section');
const showLoginBtn = document.getElementById('show-login-btn');
const showSignupBtn = document.getElementById('show-signup-btn');

const loginFormEl = document.getElementById('login-form');
const loginUserIdInputEl = document.getElementById('user-id-input');
const loginPasswordInputEl = document.getElementById('password-input');
const loginErrorEl = document.getElementById('login-error');

const signupFormEl = document.getElementById('signup-form');
const signupUserIdInputEl = document.getElementById('signup-user-id-input');
const signupNameInputEl = document.getElementById('signup-name-input');
const signupEmailInputEl = document.getElementById('signup-email-input');
const signupPasswordInputEl = document.getElementById('signup-password-input');
const signupErrorEl = document.getElementById('signup-error');

const session = getCurrentSession();
if (session) {
  window.location.href = './workspaces.html';
}

function showLogin() {
  loginSectionEl.classList.remove('hidden');
  signupSectionEl.classList.add('hidden');
  showLoginBtn.classList.add('btn-primary');
  showSignupBtn.classList.remove('btn-primary');
}

function showSignup() {
  signupSectionEl.classList.remove('hidden');
  loginSectionEl.classList.add('hidden');
  showSignupBtn.classList.add('btn-primary');
  showLoginBtn.classList.remove('btn-primary');
}

showLoginBtn.addEventListener('click', showLogin);
showSignupBtn.addEventListener('click', showSignup);

loginFormEl.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginErrorEl.textContent = '';

  try {
    await loginMock({
      userId: loginUserIdInputEl.value,
      password: loginPasswordInputEl.value
    });
    window.location.href = './workspaces.html';
  } catch (error) {
    loginErrorEl.textContent = error.message;
  }
});

signupFormEl.addEventListener('submit', async (event) => {
  event.preventDefault();
  signupErrorEl.textContent = '';

  try {
    await signupMock({
      userId: signupUserIdInputEl.value,
      name: signupNameInputEl.value,
      email: signupEmailInputEl.value,
      password: signupPasswordInputEl.value
    });
    signupErrorEl.textContent = '회원가입이 완료되었습니다. 로그인 탭에서 로그인해주세요.';
    showLogin();
  } catch (error) {
    signupErrorEl.textContent = error.message;
  }
});
