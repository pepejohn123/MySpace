(() => {
const loginForm = document.getElementById('loginForm');
const loginButton = loginForm?.querySelector('button[type="submit"]');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const loginFeedback = document.getElementById('login-feedback');
const LOGIN_AUTH_PROVIDER = String(window.APP_CONFIG?.AUTH_PROVIDER || 'local').toLowerCase();

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

function redirectByRole(role) {
  if (role === 'admin') {
    window.location.href = '../admin/Admin.html';
    return;
  }

  window.location.href = '../residente/Residente.html';
}

function getExistingSessionRole() {
  if (existingRole) {
    return existingRole;
  }

if (LOGIN_AUTH_PROVIDER === 'cognito' && existingToken) {
    return decodeJwt(existingToken)?.['custom:role'] || null;
  }

  return null;
}

const resolvedExistingRole = getExistingSessionRole();

if (existingToken && resolvedExistingRole) {
  redirectByRole(resolvedExistingRole);
}

function handleCognitoLogin() {
  if (typeof AmazonCognitoIdentity === 'undefined') {
    setLoginFeedback('No se cargó la librería de Cognito.', 'error');
    setLoginLoadingState(false);
    return;
  }

  const email = document.getElementById('emailInput').value;
  const password = document.querySelector('input[type=password]').value;
  const poolData = {
    UserPoolId: window.APP_CONFIG?.COGNITO_USER_POOL_ID,
    ClientId: window.APP_CONFIG?.COGNITO_CLIENT_ID
  };

  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: email,
    Password: password
  });

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: email,
    Pool: userPool
  });

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess(result) {
      const idToken = result.getIdToken().getJwtToken();
      const payload = decodeJwt(idToken);
      const userRole = payload?.['custom:role'] || 'residente';

      saveSession({
        token: idToken,
        role: userRole,
        user: {
          sub: payload?.sub,
          email: payload?.email || email,
          name: payload?.name || email.split('@')[0],
          role: userRole,
          condominioId: payload?.['custom:condominioId'] || null,
          propertyId: payload?.['custom:propertyId'] || null
        }
      });

      setLoginFeedback('Inicio de sesión correcto', 'success');
      redirectByRole(userRole);
    },

    onFailure(err) {
      console.error(err);
      const errorMsg = err.code === 'NotAuthorizedException'
        ? 'Credenciales incorrectas'
        : err.message || 'Error al iniciar sesión';

      setLoginFeedback(errorMsg, 'error');
      showFeedback(errorMsg, 'error');
      setLoginLoadingState(false);
    },

    newPasswordRequired(userAttributes) {
      const newPassword = prompt('Primer inicio de sesión. Ingresa tu nueva contraseña definitiva:');

      if (newPassword) {
        delete userAttributes.email_verified;
        delete userAttributes.email;
        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, this);
      } else {
        setLoginLoadingState(false);
      }
    }
  });
}

async function handleLocalLogin() {
  setLoginFeedback('La autenticación local ya no está habilitada. Usa Cognito.', 'error');
  showFeedback('La autenticación local ya no está habilitada. Usa Cognito.', 'error');
  setLoginLoadingState(false);
}

if (!loginForm) {
  return;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  setLoginFeedback('');
  setLoginLoadingState(true);

  if (LOGIN_AUTH_PROVIDER === 'cognito') {
    handleCognitoLogin();
    return;
  }

  await handleLocalLogin();
});

})();