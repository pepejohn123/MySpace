const loginForm = document.getElementById('loginForm');
const loginButton = loginForm.querySelector('button[type="submit"]');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const loginFeedback = document.getElementById('login-feedback');

// 🚨 1. CONFIGURACIÓN DE COGNITO (Reemplaza con tus datos reales)
const poolData = {
  UserPoolId: 'us-east-2_5dD02eV3g', // Tu ID de grupo de usuarios
  ClientId: 'nfn9aeuehh12n7oq3ckekmhjo'  // Tu ID de cliente de aplicación (Sin secreto)
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// Utilidad visual
function setLoginFeedback(message = '', type = '') {
  if (!loginFeedback) return;
  loginFeedback.textContent = message;
  loginFeedback.className = `login-feedback${type ? ` ${type}` : ''}`;
}

function setLoginLoadingState(isLoading) {
  if (!loginButton || !btnText || !loader) return;
  loginButton.disabled = isLoading;
  loginButton.classList.toggle('btn-loading', isLoading);
  btnText.textContent = isLoading ? 'Validando...' : 'Iniciar Sesión';
  loader.style.display = isLoading ? 'inline-block' : 'none';
}

// Utilidad para decodificar el Token de Cognito y leer el Rol sin llamar al backend
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Redirección si ya hay sesión iniciada
const existingToken = typeof getToken === 'function' ? getToken() : localStorage.getItem('token');
const existingRole = typeof getRole === 'function' ? getRole() : localStorage.getItem('role');

if (existingToken && existingRole) {
  if (existingRole === 'admin') window.location.href = '../admin/Admin.html';
  if (existingRole === 'residente') window.location.href = '../residente/Residente.html';
}

// 🚨 2. NUEVO MANEJADOR DEL FORMULARIO CON COGNITO
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  setLoginFeedback('');
  setLoginLoadingState(true);

  const email = document.getElementById('emailInput').value;
  const password = document.querySelector('input[type=password]').value;

  // Preparamos los datos para Cognito
  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: email,
    Password: password,
  });

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: email,
    Pool: userPool,
  });

  // Hacemos la petición a AWS
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      // Extraemos el token JWT válido
      const idToken = result.getIdToken().getJwtToken();

      // Decodificamos el token para sacar el rol y los datos del usuario
      const payload = decodeJwt(idToken);

      // Extraemos el rol (si lo guardaste como atributo personalizado en Cognito)
      // Si usas grupos de Cognito en lugar de atributos, la lógica cambiaría un poco.
      const userRole = payload['custom:role'] || 'residente';

      // Creamos el objeto "data" exactamente como lo espera tu función saveSession() en auth.js
      const sessionData = {
        token: idToken,
        role: userRole,
        user: {
          sub: payload.sub,
          email: payload.email,
          name: payload.name || payload.email.split('@')[0], // Fallback si no hay nombre
          role: userRole,
          condominioId: payload['custom:condominioId'] || null,
          propertyId: payload['custom:propertyId'] || null
        }
      };

      // Guardamos la sesión usando tu función existente
      saveSession(sessionData);
      setLoginFeedback('Inicio de sesión correcto', 'success');

      // Redirigimos según el rol
      if (userRole === 'admin') {
        window.location.href = '../admin/Admin.html';
      } else {
        window.location.href = '../residente/Residente.html';
      }
    },

    onFailure: function (err) {
      console.error(err);
      const errorMsg = err.code === 'NotAuthorizedException'
        ? 'Credenciales incorrectas'
        : 'Error al iniciar sesión';

      setLoginFeedback(errorMsg, 'error');
      showFeedback(errorMsg, 'error');
      setLoginLoadingState(false);
    },

    newPasswordRequired: function (userAttributes, requiredAttributes) {
      // Si creaste al usuario en AWS console, la primera vez pedirá cambiar contraseña
      const newPassword = prompt("Primer inicio de sesión. Ingresa tu nueva contraseña definitiva:");

      if (newPassword) {
        // 🚨 LA SOLUCIÓN: Borramos el email de los atributos para que Cognito no se enoje
        delete userAttributes.email_verified;
        delete userAttributes.email; // <--- Agrega esta línea

        cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, this);
      } else {
        setLoginLoadingState(false);
      }
    }
  });
});