/**
 * Error Handling Middleware
 * Manejo centralizado de errores para la API
 */

const { sanitize, sanitizeHeaders, REDACTED } = require('../utils/sanitizer');

/**
 * Middleware para rutas no encontradas
 */
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Middleware para manejo de errores
 *
 * SEGURIDAD: todo dato del request (body, params, query, headers) pasa por
 * `sanitize()` antes de escribirse al log. Esto previene la fuga de
 * contraseñas, tokens y otros secretos en logs de error.
 *
 * Cambios respecto a la versión anterior:
 *  - `sanitize` se importa desde `utils/sanitizer` (case-insensitive + regex).
 *  - Se sanitizan también los headers HTTP (authorization, cookie, etc.).
 *  - El `error.stack` se trunca a 2000 chars para no explotar el log.
 */
const errorHandler = (logger) => (error, req, res, next) => {
  let statusCode = error.statusCode || (typeof error.status === 'number' ? error.status : 500);
  let message = error.message || 'Error interno del servidor';

  if (statusCode === 500) {
    logger.error('Error en la aplicación:', {
      message: error.message,
      // Truncar stack para evitar crecimiento descontrolado del log
      stack: typeof error.stack === 'string' ? error.stack.substring(0, 2000) : undefined,
      url: req.originalUrl || req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: sanitize(req.body),
      params: sanitize(req.params),
      query: sanitize(req.query),
      headers: sanitizeHeaders(req.headers),
    });
  } else if (statusCode === 400) {
    // 400: usar console.error (no el logger central) para no duplicar en disco
    console.error(
      '### 400 BAD REQUEST ###:',
      message,
      'body:',
      sanitize(req.body),
      'params:',
      sanitize(req.params),
      'query:',
      sanitize(req.query)
    );
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