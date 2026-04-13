const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const userRepository = require('../repositories/user.repository');

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    superadmin: user.superadmin || false,
    condominioId: user.condominioId,
    propertyId: user.propertyId || null
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      superadmin: user.superadmin || false,
      name: user.name,
      condominioId: user.condominioId,
      propertyId: user.propertyId || null
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function login(email, password) {
  const user = userRepository.findByEmail(email);

  if (!user) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  return {
    token: createToken(user),
    role: user.role,
    user: serializeUser(user)
  };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  login,
  verifyToken,
  serializeUser,
  createToken
};