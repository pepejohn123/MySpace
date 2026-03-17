const API_BASE_URL = 'http://localhost:3001';
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

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
      alert(data.message || 'Credenciales incorrectas');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (data.role === 'admin') {
      window.location.href = '../admin/Admin.html';
    }

    if (data.role === 'residente') {
      window.location.href = '../residente/Residente.html';
    }
  } catch (_error) {
    alert('No se pudo conectar con el backend de login.');
  }
});