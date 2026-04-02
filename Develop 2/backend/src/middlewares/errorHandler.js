function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    message: error.message || 'Error interno del servidor',
    ...(error.details ? { details: error.details } : {})
  });
}

module.exports = errorHandler;