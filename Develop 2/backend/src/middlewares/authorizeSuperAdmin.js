function authorizeSuperAdmin(req, res, next) {
  if (!req.user?.role) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  if (req.user.role !== 'admin' || req.user.superadmin !== true) {
    return res.status(403).json({ message: 'Solo un superadmin puede realizar esta acción' });
  }

  return next();
}

module.exports = authorizeSuperAdmin;