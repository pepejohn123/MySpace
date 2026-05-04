const API_BASE_URL = String(window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const AUTH_PROVIDER = String(window.APP_CONFIG?.AUTH_PROVIDER || 'local').toLowerCase();

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (_error) {
    return null;
  }
}

function buildUserFromCognitoToken(token) {
  const payload = decodeJwt(token);

  if (!payload) {
    return null;
  }

  const paymentDayStart = payload['custom:paymentDayStart']
    ? Number(payload['custom:paymentDayStart'])
    : null;
  const paymentDayEnd = payload['custom:paymentDayEnd']
    ? Number(payload['custom:paymentDayEnd'])
    : null;

  return {
    id: payload.sub || payload['cognito:username'] || null,
    sub: payload.sub || null,
    email: payload.email || null,
    name: payload.name || payload.email?.split('@')[0] || 'Usuario',
    role: payload['custom:role'] || getRole() || 'residente',
    condominioId: payload['custom:condominioId'] || null,
    propertyId: payload['custom:propertyId'] || null,
    paymentDayStart,
    paymentDayEnd
  };
}

function isTokenExpired(token) {
  const payload = decodeJwt(token);

  if (!payload?.exp) {
    return false;
  }

  return (payload.exp * 1000) <= Date.now();
}

function getToken() {
  return localStorage.getItem('token');
}

function getRole() {
  return localStorage.getItem('role');
}

function getUser() {
  const rawUser = localStorage.getItem('user');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (_error) {
    clearSession();
    return null;
  }
}

function saveSession(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('role', data.role);
  localStorage.setItem('user', JSON.stringify(data.user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
}

function logout() {
  clearSession();
  window.location.href = '../login/Login.html';
}

async function fetchCurrentUser() {
  const token = getToken();

  if (!token) {
    return null;
  }

  if (AUTH_PROVIDER === 'cognito') {
    if (isTokenExpired(token)) {
      clearSession();
      return null;
    }

    const cachedUser = getUser();

    if (cachedUser) {
      return cachedUser;
    }

    const rebuiltUser = buildUserFromCognitoToken(token);

    if (!rebuiltUser) {
      clearSession();
      return null;
    }

    localStorage.setItem('user', JSON.stringify(rebuiltUser));
    localStorage.setItem('role', rebuiltUser.role);
    return rebuiltUser;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const data = await response.json();

    if (!data.user) {
      clearSession();
      return null;
    }

    const cachedUser = getUser();

    localStorage.setItem(
      'user',
      JSON.stringify({
        ...(cachedUser || {}),
        id: data.user.sub,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        condominioId: data.user.condominioId,
        propertyId: data.user.propertyId || null
      })
    );

    localStorage.setItem('role', data.user.role);

    return data.user;
  } catch (_error) {
    clearSession();
    return null;
  }
}

async function requireAuth(expectedRole) {
  const token = getToken();
  const role = getRole();

  if (!token) {
    clearSession();
    window.location.href = '../login/Login.html';
    return null;
  }

  if (AUTH_PROVIDER !== 'cognito' && !role) {
    clearSession();
    window.location.href = '../login/Login.html';
    return null;
  }

  const currentUser = await fetchCurrentUser();

  if (!currentUser) {
    window.location.href = '../login/Login.html';
    return null;
  }

  if (expectedRole && currentUser.role !== expectedRole) {
    clearSession();
    window.location.href = '../login/Login.html';
    return null;
  }

  return currentUser;
}