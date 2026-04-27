const bcrypt = require('bcryptjs');

const ROLES = require('../constants/roles');
const userRepository = require('../repositories/user.repository');
const createHttpError = require('../utils/httpError');

function buildUserId(role) {
  return `user_${role}_${Date.now()}`;
}

async function registerUser(payload) {
  const email = String(payload.email || '').trim();
  const password = String(payload.password || '').trim();
  const name = String(payload.name || '').trim();
  const condominioId = String(payload.condominioId || '').trim();
  const propertyId = payload.propertyId ?? null;
  const role = ROLES.RESIDENTE;
  const superadmin = false;

  if (!email || !password || !name || !condominioId) {
    throw createHttpError(400, 'email, password, name y condominioId son requeridos');
  }

  if (userRepository.existsByEmail(email)) {
    throw createHttpError(409, 'Ya existe un usuario con ese email');
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: buildUserId(role),
    email,
    passwordHash,
    role,
    superadmin,
    name,
    condominioId,
    propertyId,
    createdAt: now,
    updatedAt: now
  };

  return userRepository.create(user);
}

module.exports = {
  registerUser
};