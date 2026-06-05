/**
 * Error Handling Middleware
 * Manejo centralizado de errores para la API
 */

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Lista de campos sensibles que NUNCA deben aparecer en logs.
 * Si se añaden a un body o query, se redactan a '[REDACTED]'.
 */
const SENSITIVE_FIELDS = new Set([
  'password', 'currentPassword', 'newPassword', 'confirmPassword',
  'secretPassword', 'adminPassword', 'token', 'auth_token', 'authorization',
  'jwt', 'jwt_secret', 'JWT_SECRET', 'cookie', 'cookies',
]);

const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(out)) {
    if (SENSITIVE_FIELDS.has(key)) {
      out[key] = '[REDACTED]';
    } else if (typeof out[key] === 'object' && out[key] !== null) {
      out[key] = sanitize(out[key]);
    }
  }
  return out;
};

/**
 * Middleware para manejo de errores
 */
const errorHandler = (logger) => (error, req, res, next) => {
  let statusCode = error.statusCode || (typeof error.status === 'number' ? error.status : 500);
  let message = error.message || 'Error interno del servidor';

  if (statusCode === 500) {
    logger.error('Error en la aplicación:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: sanitize(req.body),
      params: sanitize(req.params),
      query: sanitize(req.query),
    });
  } else if (statusCode === 400) {
    console.error('### 400 BAD REQUEST ###:', message, sanitize(req.body));
  }

  // Errores específicos de PostgreSQL
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        statusCode = 409;
        message = 'El registro ya existe';
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        message = 'Referencia inválida';
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        message = 'Campo requerido faltante';
        break;
      case '42703': // undefined_column
        statusCode = 400;
        message = 'Campo inválido en la solicitud';
        break;
    }
  }

  // Errores de validación (Joi)
  if (error.isJoi) {
    statusCode = 400;
    message = error.details[0].message;
  }

  // Errores de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Errores de rate limiting
  if (error.type === 'rate_limit') {
    statusCode = 429;
    message = 'Demasiadas solicitudes, intente más tarde';
  }

  // Respuesta de error
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        code: error.code,
      }),
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Middleware para capturar errores asíncronos no manejados
 */
const asyncErrorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Clase personalizada para errores de la aplicación
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  notFound,
  errorHandler,
  asyncErrorHandler,
  AppError,
};