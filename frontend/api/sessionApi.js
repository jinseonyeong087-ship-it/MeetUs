import { seedAccounts, seedUser } from './mockData.js';

const SESSION_KEY = 'meetus-mock-session';
const ACCOUNTS_KEY = 'meetus-mock-accounts';

function ensureAccounts() {
  const raw = window.localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seedAccounts));
  }
}

function getAccounts() {
  ensureAccounts();
  return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || '[]');
}

function saveAccounts(accounts) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

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

export async function loginMock({ userId, password }) {
  if (!userId?.trim() || !password?.trim()) {
    throw new Error('유저 ID와 비밀번호를 입력해주세요.');
  }

  const account = getAccounts().find(
    (item) => item.userId === userId.trim() && item.password === password.trim()
  );

  if (!account) {
    throw new Error('유저 ID 또는 비밀번호가 올바르지 않습니다.');
  }

  const session = {
    user: {
      ...seedUser,
      userId: account.userId,
      name: account.name,
      email: account.email
    },
    loggedInAt: new Date().toISOString()
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function signupMock({ userId, name, email, password }) {
  if (!userId?.trim() || !name?.trim() || !email?.trim() || !password?.trim()) {
    throw new Error('회원가입 정보를 모두 입력해주세요.');
  }

  const accounts = getAccounts();
  if (accounts.some((item) => item.userId === userId.trim())) {
    throw new Error('이미 사용 중인 유저 ID입니다.');
  }

  const account = {
    userId: userId.trim(),
    name: name.trim(),
    email: email.trim(),
    password: password.trim()
  };

  saveAccounts([account, ...accounts]);
  return account;
}

export function logoutMock() {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem('meetus-current-workspace');
  window.location.href = './login.html';
}
