Claro. Te lo explico por capas para que entiendan **qué hace cada parte**, **por qué existe** y **cómo viaja la información** desde que el usuario escribe su correo hasta que entra al sistema.

---

# 1. Qué construimos realmente
Ahorita no hicimos todavía un sistema completo con base de datos y Cognito.
Lo que sí hicimos fue un **login funcional mínimo con JWT**.

Eso significa que el flujo ya hace esto:
1. el usuario mete correo y contraseña en el frontend
2. el frontend manda esos datos al backend
3. el backend valida si el usuario existe
4. si la contraseña es correcta, genera un token JWT
5. el frontend guarda ese token
6. según el rol, redirige a Admin o Residente

Entonces ahorita el backend ya hace autenticación básica y emisión de token.

---

# 2. Archivos importantes
Los archivos clave quedaron así:

## Backend
- `Develop 2/backend/package.json`
- `Develop 2/backend/src/app.js`
- `Develop 2/backend/.env.example`
- `Develop 2/backend/.env`

## Frontend
- `Develop 2/frontend/js/Login.js`
- `Develop 2/frontend/pages/login/Login.html`

---

# 3. Cómo funciona el backend
El backend está hecho con **Express**.
Express es un framework de Node.js para crear APIs HTTP.

Cuando corres:
```bash
node src/app.js
```
Node ejecuta `app.js`, y ese archivo hace varias cosas.

---

## 3.1 Carga de librerías
En la parte de arriba del archivo:
```js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
```

### Qué hace cada una
- `express`: crea el servidor HTTP y las rutas
- `cors`: permite que el frontend en otro puerto/origen pueda hablar con el backend
- `jsonwebtoken`: firma y valida tokens JWT
- `bcryptjs`: compara contraseñas de forma segura
- `dotenv`: carga variables desde `.env`

---

## 3.2 Configuración base
Luego:
```js
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_myspace_secret_change_me';
```

### Qué significa
- `app` es la aplicación de Express
- `PORT` es el puerto donde corre el backend
- `JWT_SECRET` es la llave secreta usada para firmar y verificar tokens

Ese secreto es importantísimo.
Porque el JWT no solo se “crea”; también se firma criptográficamente.
Si alguien intenta modificar el token manualmente, la firma ya no coincide y el backend lo rechaza.

---

## 3.3 Middlewares globales
Luego:
```js
app.use(cors());
app.use(express.json());
```

### Qué hacen
#### `cors()`
Permite peticiones desde el frontend, por ejemplo desde:
- `http://localhost:5500`

Sin esto, el navegador podría bloquear la llamada por política de mismo origen.

#### `express.json()`
Le dice al backend que cuando llegue un body JSON, lo convierta a objeto JavaScript.

Por ejemplo, si llega esto:
```json
{
  "email": "admin@myspace.com",
  "password": "Admin123*"
}
```
Entonces ya lo puedes leer con:
```js
req.body.email
req.body.password
```

---

# 4. Usuarios mock del backend
Luego definimos:
```js
const users = [ ... ]
```

Eso es una lista temporal de usuarios en memoria.
No está en base de datos todavía.

Cada usuario tiene:
- `id`
- `email`
- `passwordHash`
- `role`
- `name`
- `condominioId`

Ejemplo:
```js
{
  id: 'user_admin_1',
  email: 'admin@myspace.com',
  passwordHash: bcrypt.hashSync('Admin123*', 10),
  role: 'admin',
  name: 'Administrador MySpace',
  condominioId: 'CONDO#101'
}
```

---

## 4.1 Por qué usamos `passwordHash`
No guardamos la contraseña como texto plano tipo:
```js
password: 'Admin123*'
```

En vez de eso, usamos:
```js
bcrypt.hashSync('Admin123*', 10)
```

Eso genera un hash.

### Diferencia entre contraseña y hash
- contraseña real: `Admin123*`
- hash: una cadena irreconocible y larga

La idea es:
- el sistema no guarda contraseñas visibles
- cuando el usuario escribe su contraseña, `bcrypt.compare(...)` revisa si corresponde con el hash guardado

Esto es mucho más seguro que comparar texto plano.

---

# 5. Función que genera el token
La función es:
```js
function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      condominioId: user.condominioId
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
```

---

## 5.1 Qué hace `jwt.sign`
`jwt.sign(payload, secret, options)` crea un token firmado.

### Payload
Es la información que metemos dentro del token:
- `sub`: subject, normalmente el id del usuario
- `email`
- `role`
- `name`
- `condominioId`

### Secret
Es la llave con la que se firma.
Solo el backend debe conocerla.

### Expiración
```js
{ expiresIn: '24h' }
```
Hace que el token caduque en 24 horas.

---

## 5.2 Importante sobre JWT
El token **no cifra** mágicamente el contenido; lo firma.
O sea:
- sí puedes decodificar el payload
- pero no puedes alterarlo sin romper la firma

Entonces el JWT sirve para:
- demostrar que el backend autenticó a ese usuario
- transportar identidad y rol sin guardar sesión en servidor

---

# 6. Middleware de autenticación
La función:
```js
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}
```

---

## 6.1 Qué hace este middleware
Este middleware protege rutas.

Cuando un cliente manda:
```http
Authorization: Bearer eyJhbGciOi...
```
El middleware:
1. toma el header `Authorization`
2. extrae el token
3. verifica la firma con `JWT_SECRET`
4. si es válido, mete el payload en `req.user`
5. deja pasar a la ruta con `next()`

Si no existe o está mal:
- responde `401 Unauthorized`

---

## 6.2 Por qué esto importa
Así el backend no necesita guardar sesiones en memoria o en servidor.
Eso se llama autenticación **stateless**.

Cada request lleva su propia prueba de identidad: el JWT.

Eso encaja muy bien con su arquitectura deseada serverless.

---

# 7. Rutas del backend
Ahorita hay 3 rutas.

---

## 7.1 `GET /api/health`
```js
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'myspace-auth-api' });
});
```

### Para qué sirve
Solo para verificar que el backend está vivo.
No autentica nada.

Respuesta esperada:
```json
{
  "ok": true,
  "service": "myspace-auth-api"
}
```

---

## 7.2 `POST /api/login`
Esta es la más importante.

Código conceptual:
```js
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  const user = users.find(...);

  if (!user) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }

  const token = createToken(user);

  return res.json({ token, role: user.role, user: ... });
});
```

---

## 7.3 Flujo interno exacto del login
### Paso 1: leer body
Del frontend llega:
```json
{
  "email": "admin@myspace.com",
  "password": "Admin123*"
}
```

### Paso 2: validar campos
Si falta alguno:
- responde `400`
- porque la petición está mal formada

### Paso 3: buscar usuario
Se busca el email en el arreglo `users`.

Si no existe:
- responde `401`
- mismo mensaje genérico

Eso está bien porque no revela si el correo existe o no.

### Paso 4: comparar contraseña
```js
await bcrypt.compare(password, user.passwordHash)
```
Esto revisa si la contraseña capturada corresponde al hash guardado.

Si no coincide:
- responde `401`

### Paso 5: crear JWT
Si sí coincide:
- se llama `createToken(user)`
- se firma el token

### Paso 6: responder al frontend
Se manda algo así:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "role": "admin",
  "user": {
    "id": "user_admin_1",
    "email": "admin@myspace.com",
    "name": "Administrador MySpace",
    "role": "admin",
    "condominioId": "CONDO#101"
  }
}
```

---

## 7.4 `GET /api/me`
```js
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
```

### Para qué sirve
Esta ruta sirve para comprobar si el token guardado sigue siendo válido.

Como usa `authenticateToken`, solo responde si mandas un JWT correcto.

Si mandas esto:
```http
Authorization: Bearer <token>
```
Te devuelve la información del usuario extraída del token.

Esto luego les sirve para:
- restaurar sesión al recargar la página
- validar quién está logueado
- saber si el rol es admin o residente

---

# 8. Cómo funciona el frontend del login
El archivo principal es:
- `Develop 2/frontend/js/Login.js`

Ahorita quedó así en lógica:
1. escuchar el submit del formulario
2. leer email y password
3. hacer `fetch` al backend
4. leer la respuesta JSON
5. guardar token y datos en `localStorage`
6. redirigir según rol

---

## 8.1 Base URL
```js
const API_BASE_URL = 'http://localhost:3001';
```

Esto existe porque el frontend corre separado del backend.

- frontend: `http://localhost:5500`
- backend: `http://localhost:3001`

Entonces el login ya no usa ruta relativa, sino absoluta.

---

## 8.2 Captura del formulario
```js
const loginForm = document.getElementById('loginForm');
```

Eso obtiene el formulario del HTML.

Luego:
```js
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  ...
});
```

### Qué hace
- escucha cuando el usuario presiona “Iniciar Sesión”
- `e.preventDefault()` evita que el navegador recargue la página como formulario tradicional
- así se puede hacer login por JavaScript con `fetch`

---

## 8.3 Leer credenciales
```js
const email = document.getElementById('emailInput').value;
const password = document.querySelector('input[type=password]').value;
```

Obtiene los valores escritos por el usuario.

---

## 8.4 Request al backend
```js
const res = await fetch(`${API_BASE_URL}/api/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
});
```

### Qué manda exactamente
Un POST a:
```text
http://localhost:3001/api/login
```
Con body JSON.

---

## 8.5 Leer respuesta
```js
const data = await res.json();
```

Esto convierte la respuesta del backend a objeto JS.

---

## 8.6 Manejo de error
```js
if (!res.ok) {
  alert(data.message || 'Credenciales incorrectas');
  return;
}
```

Si backend regresó `400`, `401`, etc.:
- muestra alerta
- no continúa

---

## 8.7 Guardar sesión
```js
localStorage.setItem('token', data.token);
localStorage.setItem('role', data.role);
localStorage.setItem('user', JSON.stringify(data.user));
```

### Qué significa esto
Se guardan datos localmente en el navegador.

- `token`: el JWT
- `role`: admin o residente
- `user`: objeto serializado

Esto permite que otras páginas luego lean esos datos.

Ejemplo futuro:
- `Admin.html` podría revisar `localStorage.getItem('role')`
- si no es admin, redirigir al login

---

## 8.8 Redirección por rol
```js
if (data.role === 'admin') {
  window.location.href = '../admin/Admin.html';
}

if (data.role === 'residente') {
  window.location.href = '../residente/Residente.html';
}
```

Eso manda al usuario a la vista correcta según su rol.

---

## 8.9 Manejo de errores de conexión
```js
catch (_error) {
  alert('No se pudo conectar con el backend de login.');
}
```

Esto pasa si:
- backend está apagado
- puerto incorrecto
- error de red

---

# 9. Flujo completo de extremo a extremo
Piénsenlo así:

## Usuario
Escribe:
- correo
- contraseña

## Frontend
Hace:
- `POST /api/login`

## Backend
Hace:
- valida campos
- busca usuario
- compara contraseña
- genera JWT
- responde token + rol + user

## Frontend
Hace:
- guarda token en `localStorage`
- redirige

## Siguiente petición protegida
Más adelante una página podría mandar:
```http
Authorization: Bearer <token>
```

## Backend
Hace:
- verifica token
- deja pasar o rechaza

---

# 10. Por qué esta implementación sí tiene sentido como MVP
Porque ya introduce las piezas reales de autenticación moderna:

- API separada del frontend
- contraseña comparada con hash
- JWT con expiración
- autenticación stateless
- roles en payload
- ruta protegida con middleware

O sea, aunque todavía es sencilla, **la estructura ya va en la dirección correcta**.

---

# 11. Qué limitaciones tiene ahorita
Es importante que también entiendan lo que todavía **no** hace:

### 1. Usuarios en memoria
Si reinicias el servidor, no pasa nada porque están hardcodeados, pero no hay base de datos real.

### 2. No hay registro de usuarios
Solo existen los dos usuarios mock.

### 3. No hay protección todavía en Admin/Residente
Ahorita puedes abrir los HTML directo si conoces la ruta.

### 4. No estamos validando rol en backend para rutas de negocio
Todavía no hay middleware tipo `authorizeRole('admin')`.

### 5. `localStorage` no es la opción más fuerte de seguridad
Para MVP sí sirve, pero en producción sería mejor evaluar cookies `HttpOnly`.

### 6. No hay refresh token
Cuando expire el JWT, el usuario tendrá que volver a loguearse.

---

# 12. Qué sigue normalmente después de esto
El siguiente paso natural sería:

1. crear un archivo utilitario para auth en frontend
2. proteger `Admin.html` y `Residente.html`
3. al cargar cada vista, verificar token y rol
4. crear logout
5. usar `/api/me` para restaurar sesión
6. mover usuarios a base de datos
7. eventualmente migrar a Cognito si quieren seguir lo documentado

---

# 13. Resumen corto para que se lo expliquen al equipo
Si lo quieren explicar rápido entre ustedes, sería así:

> El backend expone un endpoint `/api/login` que recibe email y password. Busca un usuario de prueba, compara la contraseña usando bcrypt y, si es válida, genera un JWT firmado con una clave secreta. Ese token contiene la identidad y rol del usuario. El frontend guarda el token en localStorage y redirige a la vista correspondiente. Luego cualquier ruta protegida puede validar ese token usando el middleware `authenticateToken`.

---

Si quieres, en el siguiente paso te puedo hacer una **explicación línea por línea del `app.js`** o un **diagrama del flujo login → token → ruta protegida**. Si ya quieres que lo implemente en las vistas protegidas, tendrías que **toggle to Act mode**.