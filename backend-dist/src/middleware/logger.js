/**
 * Logging Middleware
 * Middleware para logging de requests HTTP
 */

const logger = (loggerInstance) => (req, res, next) => {
  const start = Date.now();

  // Log de la request entrante
  loggerInstance.info('Request entrante', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? JSON.stringify(req.body).substring(0, 500) : undefined,
  });

  // Override res.end para capturar la respuesta
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;

    // Log de la response
    loggerInstance.info('Response saliente', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
    });

    // Restaurar el método original
    res.end = originalEnd;
    res.end(chunk, encoding);
  };

  next();
};

module.exports = {
  logger,
};