const SESSION_KEY = 'meetus-mock-session';
const API_BASE_URL = window.__API_BASE_URL || '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const message = payload?.message || '요청 처리 중 오류가 발생했습니다.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return payload;
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

export function getAccessToken() {
  return getCurrentSession()?.accessToken || '';
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function loginMock({ userId, password }) {
  const email = userId?.trim();
  if (!email || !password?.trim()) {
    throw new Error('이메일과 비밀번호를 입력해주세요.');
  }

  let payload;
  try {
    payload = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password.trim() })
    });
  } catch (error) {
    if (error?.status === 404) {
      throw new Error('현재 백엔드에 로그인 API(/auth/login)가 아직 구현되지 않았습니다.');
    }
    throw error;
  }

  const accessToken = payload?.access_token;
  if (!accessToken) {
    throw new Error('로그인 토큰을 받지 못했습니다.');
  }
  const tokenClaims = decodeJwtPayload(accessToken) || {};

  const session = {
    user: {
      userId: tokenClaims.user_id || tokenClaims.sub || email,
      name: tokenClaims.name || email.split('@')[0],
      email: tokenClaims.email || email
    },
    accessToken,
    loggedInAt: new Date().toISOString()
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function signupMock({ userId, name, email, password }) {
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    throw new Error('회원가입 정보를 모두 입력해주세요.');
  }

  try {
    const account = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        name: name.trim(),
        password: password.trim()
      })
    });
    return {
      userId: account?.user_id || userId?.trim() || email.trim(),
      name: name.trim(),
      email: email.trim(),
      password: password.trim()
    };
  } catch (error) {
    if (error?.status === 404) {
      throw new Error('현재 백엔드에 회원가입 API(/auth/signup)가 아직 구현되지 않았습니다.');
    }
    throw error;
  }
}

export function logoutMock() {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem('meetus-current-workspace');
  window.location.href = './login.html';
}
