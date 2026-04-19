const API_BASE_URL = String(window.APP_CONFIG?.API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

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

  if (!token || !role) {
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