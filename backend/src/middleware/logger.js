/**
 * Logging Middleware
 * Middleware para logging de requests HTTP
 *
 * SEGURIDAD (refactor 2026-06): este middleware solía loguear el body crudo
 * en cada request, lo que filtraba contraseñas, tokens y otros secretos.
 * Ahora:
 *  - El body se sanitiza via `utils/sanitizer` antes de loguearse.
 *  - No se loguea el body si el Content-Type no es JSON (CoA PDFs, multipart).
 *  - Los headers se sanitizan (authorization, cookie → [REDACTED]).
 *  - El body saneado se trunca a 500 chars tras sanitizar.
 */

const { sanitize, sanitizeHeaders } = require('../utils/sanitizer');

const MAX_LOG_BODY_LENGTH = 500;

/**
 * Determina si el body del request debe ser logueado.
 * Reglas:
 *  - GET/HEAD/DELETE/OPTIONS → nunca (no deberían tener body relevante).
 *  - Content-Type no-JSON → nunca (binarios, multipart, PDFs, etc.).
 *  - Sin body (objeto vacío) → omitir campo.
 */
const shouldLogBody = (req) => {
  if (!req.body || typeof req.body !== 'object') return false;
  if (Array.isArray(req.body) && req.body.length === 0) return false;
  if (Object.keys(req.body).length === 0) return false;

  // Solo JSON
  const ct = (req.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) return false;

  return true;
};

const logger = (loggerInstance) => (req, res, next) => {
  const start = Date.now();

  // ── Log de la request entrante ───────────────────────────────────────
  const logPayload = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };

  if (shouldLogBody(req)) {
    // Sanitizar ANTES de stringify para que las claves sensibles se
    // reemplacen por [REDACTED] y no consuman cuota de los 500 chars.
    const safeBody = sanitize(req.body);
    const serialized = JSON.stringify(safeBody);
    logPayload.body =
      serialized.length > MAX_LOG_BODY_LENGTH
        ? serialized.substring(0, MAX_LOG_BODY_LENGTH) + '…[truncated]'
        : serialized;
  }

  // Headers sensibles (authorization, cookie, etc.) → [REDACTED]
  logPayload.headers = sanitizeHeaders(req.headers);

  loggerInstance.info('Request entrante', logPayload);

  // ── Override res.end para capturar la respuesta ─────────────────────
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - start;

    // Log de la response — NO incluir el chunk (puede ser binario, JSON con
    // passwords de respuesta de error, etc.). Solo metadatos.
    loggerInstance.info('Response saliente', {
      method: req.method,
      url: req.originalUrl || req.url,
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
  // Exportado para tests
  shouldLogBody,
};
