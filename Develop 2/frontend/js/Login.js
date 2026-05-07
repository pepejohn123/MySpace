(() => {
const loginForm = document.getElementById('loginForm');
const loginButton = loginForm?.querySelector('button[type="submit"]');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const loginFeedback = document.getElementById('login-feedback');
const LOGIN_AUTH_PROVIDER = String(window.APP_CONFIG?.AUTH_PROVIDER || 'local').toLowerCase();

// ── Forgot password panel elements ───────────────────────────
const forgotPasswordPanel = document.getElementById('forgotPasswordPanel');
const forgotStep1 = document.getElementById('forgot-step-1');
const forgotStep2 = document.getElementById('forgot-step-2');
const forgotFeedback1 = document.getElementById('forgot-feedback-1');
const forgotFeedback2 = document.getElementById('forgot-feedback-2');
const sendCodeBtn = document.getElementById('sendCodeBtn');
const confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
const codeGroup = document.getElementById('code-group');
const forgotStep2Msg = document.getElementById('forgot-step-2-msg');

// Holds state across the two-step forgot/first-login flow
let pendingCognitoUser = null;
let pendingUserAttributes = null;
let isNewPasswordRequired = false;

// ── Panel visibility helpers ──────────────────────────────────
function showLoginPanel() {
  loginForm.style.display = '';
  forgotPasswordPanel.style.display = 'none';
}

function showForgotPanel() {
  loginForm.style.display = 'none';
  forgotPasswordPanel.style.display = '';
  forgotStep1.style.display = '';
  forgotStep2.style.display = 'none';
  setForgotFeedback1('');
  setForgotFeedback2('');
}

function showForgotStep2(hideCodeField, message) {
  forgotStep1.style.display = 'none';
  forgotStep2.style.display = '';
  codeGroup.style.display = hideCodeField ? 'none' : '';
  forgotStep2Msg.textContent = message || 'Ingresa el código que recibiste y tu nueva contraseña.';
  document.getElementById('newPasswordInput').value = '';
  document.getElementById('verificationCode').value = '';
}

// ── Feedback helpers ──────────────────────────────────────────
function setLoginFeedback(message = '', type = '') {
  if (!loginFeedback) return;
  loginFeedback.textContent = message;
  loginFeedback.className = `login-feedback${type ? ` ${type}` : ''}`;
}

function setForgotFeedback1(message = '', type = '') {
  if (!forgotFeedback1) return;
  forgotFeedback1.textContent = message;
  forgotFeedback1.className = `login-feedback${type ? ` ${type}` : ''}`;
}

function setForgotFeedback2(message = '', type = '') {
  if (!forgotFeedback2) return;
  forgotFeedback2.textContent = message;
  forgotFeedback2.className = `login-feedback${type ? ` ${type}` : ''}`;
}

function setLoginLoadingState(isLoading) {
  if (!loginButton || !btnText || !loader) return;
  loginButton.disabled = isLoading;
  loginButton.classList.toggle('btn-loading', isLoading);
  btnText.textContent = isLoading ? 'Validando...' : 'Iniciar Sesión';
  loader.style.display = isLoading ? 'inline-block' : 'none';
}

// ── Session / JWT helpers ─────────────────────────────────────
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
  if (existingRole) return existingRole;
  if (LOGIN_AUTH_PROVIDER === 'cognito' && existingToken) {
    return decodeJwt(existingToken)?.['custom:role'] || null;
  }
  return null;
}

const resolvedExistingRole = getExistingSessionRole();
if (existingToken && resolvedExistingRole) {
  redirectByRole(resolvedExistingRole);
}

// ── Cognito pool factory ──────────────────────────────────────
function getCognitoPool() {
  return new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: window.APP_CONFIG?.COGNITO_USER_POOL_ID,
    ClientId: window.APP_CONFIG?.COGNITO_CLIENT_ID,
  });
}

function makeCognitoUser(email) {
  return new AmazonCognitoIdentity.CognitoUser({
    Username: email,
    Pool: getCognitoPool(),
  });
}

// ── Login flow ────────────────────────────────────────────────
function handleCognitoLogin() {
  if (typeof AmazonCognitoIdentity === 'undefined') {
    setLoginFeedback('No se cargó la librería de Cognito.', 'error');
    setLoginLoadingState(false);
    return;
  }

  const email = document.getElementById('emailInput').value;
  const password = document.querySelector('input[type=password]').value;

  const cognitoUser = makeCognitoUser(email);
  const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: email,
    Password: password,
  });

  cognitoUser.authenticateUser(authDetails, {
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
          propertyId: payload?.['custom:propertyId'] || null,
        },
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

    // First login with temporary password — show inline form instead of prompt()
    newPasswordRequired(userAttributes) {
      pendingCognitoUser = cognitoUser;
      pendingUserAttributes = userAttributes;
      isNewPasswordRequired = true;
      setLoginLoadingState(false);
      showForgotPanel();
      showForgotStep2(
        true, // hide code field — no code needed for first login
        'Es tu primer inicio de sesión. Elige tu contraseña definitiva.'
      );
    },
  });
}

// ── Forgot password: step 1 (send code) ──────────────────────
function handleSendCode() {
  const email = document.getElementById('forgotEmailInput').value.trim();
  if (!email) {
    setForgotFeedback1('Ingresa tu correo electrónico.', 'error');
    return;
  }

  setForgotFeedback1('Enviando código...', '');
  sendCodeBtn.disabled = true;

  const cognitoUser = makeCognitoUser(email);
  pendingCognitoUser = cognitoUser;
  isNewPasswordRequired = false;

  cognitoUser.forgotPassword({
    onSuccess() {
      // confirmPassword callback — shouldn't fire here but handle gracefully
    },
    onFailure(err) {
      setForgotFeedback1(err.message || 'Error al enviar el código.', 'error');
      sendCodeBtn.disabled = false;
    },
    inputVerificationCode() {
      setForgotFeedback1('');
      sendCodeBtn.disabled = false;
      showForgotStep2(false, 'Ingresa el código que recibiste y tu nueva contraseña.');
    },
  });
}

// ── Forgot password: step 2 (confirm code + new password) ─────
function handleConfirmNewPassword() {
  const code = document.getElementById('verificationCode').value.trim();
  const newPassword = document.getElementById('newPasswordInput').value;

  if (!newPassword) {
    setForgotFeedback2('Ingresa tu nueva contraseña.', 'error');
    return;
  }
  if (!isNewPasswordRequired && !code) {
    setForgotFeedback2('Ingresa el código de verificación.', 'error');
    return;
  }

  setForgotFeedback2('Guardando...', '');
  confirmPasswordBtn.disabled = true;

  if (isNewPasswordRequired) {
    // Complete first-login challenge — no code needed
    delete pendingUserAttributes.email_verified;
    delete pendingUserAttributes.email;

    pendingCognitoUser.completeNewPasswordChallenge(newPassword, pendingUserAttributes, {
      onSuccess(result) {
        const idToken = result.getIdToken().getJwtToken();
        const payload = decodeJwt(idToken);
        const userRole = payload?.['custom:role'] || 'residente';

        saveSession({
          token: idToken,
          role: userRole,
          user: {
            sub: payload?.sub,
            email: payload?.email,
            name: payload?.name || payload?.email?.split('@')[0],
            role: userRole,
            condominioId: payload?.['custom:condominioId'] || null,
            propertyId: payload?.['custom:propertyId'] || null,
          },
        });

        redirectByRole(userRole);
      },
      onFailure(err) {
        setForgotFeedback2(err.message || 'Error al guardar la contraseña.', 'error');
        confirmPasswordBtn.disabled = false;
      },
    });
  } else {
    // Confirm forgot password with verification code
    pendingCognitoUser.confirmPassword(code, newPassword, {
      onSuccess() {
        showLoginPanel();
        setLoginFeedback('Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
        confirmPasswordBtn.disabled = false;
      },
      onFailure(err) {
        setForgotFeedback2(err.message || 'Código incorrecto o contraseña no válida.', 'error');
        confirmPasswordBtn.disabled = false;
      },
    });
  }
}

// ── Event listeners ───────────────────────────────────────────
if (!loginForm) return;

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoginFeedback('');
  setLoginLoadingState(true);

  if (LOGIN_AUTH_PROVIDER === 'cognito') {
    handleCognitoLogin();
    return;
  }

  setLoginFeedback('La autenticación local ya no está habilitada. Usa Cognito.', 'error');
  setLoginLoadingState(false);
});

document.getElementById('forgotPasswordLink')?.addEventListener('click', () => {
  setLoginFeedback('');
  showForgotPanel();
  // Pre-fill the forgot email with whatever was typed in the login form
  const loginEmail = document.getElementById('emailInput').value;
  if (loginEmail) document.getElementById('forgotEmailInput').value = loginEmail;
});

document.getElementById('backToLoginBtn')?.addEventListener('click', showLoginPanel);

sendCodeBtn?.addEventListener('click', handleSendCode);
confirmPasswordBtn?.addEventListener('click', handleConfirmNewPassword);

})();
