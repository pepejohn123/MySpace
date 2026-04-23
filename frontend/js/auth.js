const API_BASE_URL = 'https://4ei3v71ie2.execute-api.us-east-2.amazonaws.com/dev';

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

  // Si no hay token, no hay usuario
  if (!token) {
    return null;
  }

  // 🚨 EL CAMBIO: Ya no hacemos un 'fetch' a /api/me.
  // En su lugar, confiamos en los datos que Cognito y Login.js
  // ya guardaron de forma segura en nuestro localStorage.
  const cachedUser = getUser();

  if (cachedUser) {
    // Si tenemos los datos, los devolvemos instantáneamente
    return cachedUser;
  } else {
    // Si por alguna razón el token está pero los datos del usuario se borraron
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