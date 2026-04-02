const loginForm = document.getElementById('loginForm');
const loginButton = loginForm.querySelector('button[type="submit"]');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const loginFeedback = document.getElementById('login-feedback');

function setLoginFeedback(message = '', type = '') {
  if (!loginFeedback) {
    return;
  }

  loginFeedback.textContent = message;
  loginFeedback.className = `login-feedback${type ? ` ${type}` : ''}`;
}

function setLoginLoadingState(isLoading) {
  if (!loginButton || !btnText || !loader) {
    return;
  }

  loginButton.disabled = isLoading;
  loginButton.classList.toggle('btn-loading', isLoading);
  btnText.textContent = isLoading ? 'Validando...' : 'Iniciar Sesión';
  loader.style.display = isLoading ? 'inline-block' : 'none';
}

const existingToken = typeof getToken === 'function' ? getToken() : localStorage.getItem('token');
const existingRole = typeof getRole === 'function' ? getRole() : localStorage.getItem('role');

if (existingToken && existingRole) {
  if (existingRole === 'admin') {
    window.location.href = '../admin/Admin.html';
  }

  if (existingRole === 'residente') {
    window.location.href = '../residente/Residente.html';
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  setLoginFeedback('');
  setLoginLoadingState(true);

  const email = document.getElementById('emailInput').value;
  const password = document.querySelector('input[type=password]').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setLoginFeedback(data.message || 'Credenciales incorrectas', 'error');
      showFeedback(data.message || 'Credenciales incorrectas', 'error');
      setLoginLoadingState(false);
      return;
    }

    saveSession(data);
    setLoginFeedback('Inicio de sesión correcto', 'success');

    if (data.role === 'admin') {
      window.location.href = '../admin/Admin.html';
    }

    if (data.role === 'residente') {
      window.location.href = '../residente/Residente.html';
    }
  } catch (_error) {
    setLoginFeedback('No se pudo conectar con el backend de login.', 'error');
    showFeedback('No se pudo conectar con el backend de login.', 'error');
  } finally {
    setLoginLoadingState(false);
  }
});