import { seedUser } from './mockData.js';

const SESSION_KEY = 'meetus-mock-session';

export function getCurrentSession() {
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function requireSession() {
  const session = getCurrentSession();
  if (!session) {
    window.location.href = './login.html';
    throw new Error('로그인이 필요합니다.');
  }
  return session;
}

export async function loginMock({ email, password }) {
  if (!email?.trim() || !password?.trim()) {
    throw new Error('이메일과 비밀번호를 입력해주세요.');
  }

  const session = {
    user: {
      ...seedUser,
      email: email.trim()
    },
    loggedInAt: new Date().toISOString()
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logoutMock() {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem('meetus-current-workspace');
  window.location.href = './login.html';
}
