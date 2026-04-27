const authService = require('../services/auth.service');
const createHttpError = require('../utils/httpError');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createHttpError(400, 'Email y contraseña son requeridos');
    }

    const authResult = await authService.login(email, password);

    if (!authResult) {
      throw createHttpError(401, 'Credenciales incorrectas');
    }

    return res.json(authResult);
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.json({ user: req.user });
}

function adminTest(_req, res) {
  return res.json({ ok: true, message: 'Ruta admin protegida correctamente' });
}

function residenteTest(_req, res) {
  return res.json({ ok: true, message: 'Ruta residente protegida correctamente' });
}

module.exports = {
  login,
  me,
  adminTest,
  residenteTest
};