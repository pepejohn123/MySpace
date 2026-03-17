const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_myspace_secret_change_me';

app.use(cors());
app.use(express.json());

const users = [
  {
    id: 'user_admin_1',
    email: 'admin@myspace.com',
    passwordHash: bcrypt.hashSync('Admin123*', 10),
    role: 'admin',
    name: 'Administrador MySpace',
    condominioId: 'CONDO#101'
  },
  {
    id: 'user_residente_1',
    email: 'residente@myspace.com',
    passwordHash: bcrypt.hashSync('Residente123*', 10),
    role: 'residente',
    name: 'Juan Pérez',
    condominioId: 'CONDO#101'
  }
];

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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'myspace-auth-api' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  const user = users.find(
    (item) => item.email.toLowerCase() === String(email).toLowerCase()
  );

  if (!user) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({ message: 'Credenciales incorrectas' });
  }

  const token = createToken(user);

  return res.json({
    token,
    role: user.role,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      condominioId: user.condominioId
    }
  });
});

app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`MySpace auth API running on http://localhost:${PORT}`);
});