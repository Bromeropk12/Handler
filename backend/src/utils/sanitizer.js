/**
 * Log Sanitizer
 *
 * Defensa en profundidad contra fuga de credenciales en logs.
 * Redacta recursivamente cualquier campo cuyo nombre coincida con la
 * lista de claves sensibles (case-insensitive, soporta camelCase y
 * snake_case).
 *
 * Cambios clave vs versión previa (errorHandler.js local):
 *  - Matching case-insensitive: 'Password' === 'password' === 'PASSWORD'.
 *  - Soporta camelCase, snake_case, kebab-case, dot.case.
 *  - NO genera falsos positivos con claves como 'credentials' (que contiene
 *    'credential' como substring pero no es un campo sensible).
 *  - Sanitiza también Headers HTTP (authorization, cookie, etc.).
 *  - Manejo seguro de Buffers, errores circulares y tipos no serializables.
 *  - Reemplazo opcional por SHA-256 truncado cuando se necesita correlación
 *    (modo 'hash' para audit forense sin exponer la credencial).
 *
 * @module utils/sanitizer
 */

'use strict';

// ────────────────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN
// ────────────────────────────────────────────────────────────────────────────

/**
 * Lista explícita de palabras sensibles (lowercase).
 * Se matchea contra la clave normalizada (snake_case) completa O contra
 * cada segmento de la clave separado por _, -, o cambios de casing.
 */
const SENSITIVE_WORDS = new Set([
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'privatekey',
  'private_key',
  'signingkey',
  'signing_key',
  'authtoken',
  'auth_token',
  'authorization',
  'passphrase',
  'jwt',
  'bearer',
  'csrf',
  'session',
  'cookie',
  'cookies',          // plural (compatibilidad con 'cookie'/'cookies')
  'signature',
  'clientsecret',
  'client_secret',
]);

/**
 * Headers HTTP que NUNCA deben aparecer en logs.
 */
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-csrf-token',
  'x-access-token',
  'x-refresh-token',
  'x-signature',
]);

const REDACTED = '[REDACTED]';
const REDACTED_HASH_PREFIX = '[REDACTED:sha256:';

// ────────────────────────────────────────────────────────────────────────────
//  UTILIDADES INTERNAS
// ────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');

/**
 * Normaliza una clave a snake_case lowercase y la divide en segmentos.
 *
 * @example
 *  normalizeKey('newPassword')     → ['new', 'password']
 *  normalizeKey('new_password')    → ['new', 'password']
 *  normalizeKey('x-api-key')       → ['x', 'api', 'key']
 *  normalizeKey('credentials')     → ['credentials']
 *  normalizeKey('PASSWORD')        → ['password']
 *  normalizeKey('accessToken')     → ['access', 'token']
 *  normalizeKey('currentPassword') → ['current', 'password']
 */
function normalizeKey(key) {
  if (typeof key !== 'string') return [];
  return key
    // 1) camelCase → snake_case: inserta _ entre minúscula y mayúscula
    //    (ANTES de lowercase, para que 'P' sea capturado como mayúscula)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    // 2) lowercase
    .toLowerCase()
    // 3) separadores (-, ., espacio) → _
    .replace(/[^a-z0-9]+/g, '_')
    // 4) trim de _
    .replace(/^_+|_+$/g, '')
    .split('_')
    .filter(Boolean);
}

/**
 * Devuelve true si la clave dada es sensible.
 * Estrategia: match exacto (lowercase) O cualquier segmento normalizado coincide.
 *
 * @param {string} key
 * @returns {boolean}
 */
function isSensitiveKey(key) {
  if (typeof key !== 'string' || key.length === 0) return false;
  const lower = key.toLowerCase();

  // Match exacto (rápido y cubre los casos comunes como 'password', 'token')
  if (SENSITIVE_WORDS.has(lower)) return true;

  // Match por segmento (camelCase / snake_case / kebab-case)
  const segments = normalizeKey(key);
  if (segments.length === 0) return false;

  // Si TODOS los segmentos son sensibles (p. ej. 'new_password' = ['new','password']),
  // o si la clave COMPLETA normalizada coincide.
  const normalized = segments.join('_');
  if (SENSITIVE_WORDS.has(normalized)) return true;

  // Match por cualquier segmento que sea sensible (p. ej. 'accessToken' → ['access','token'])
  return segments.some((s) => SENSITIVE_WORDS.has(s));
}

/**
 * Devuelve true si el header HTTP es sensible.
 * @param {string} name
 * @returns {boolean}
 */
function isSensitiveHeader(name) {
  if (typeof name !== 'string') return false;
  return SENSITIVE_HEADERS.has(name.toLowerCase());
}

/**
 * Hash SHA-256 truncado (8 chars) para correlación forense.
 * @param {string} value
 * @returns {string}
 */
function shortHash(value) {
  try {
    return crypto
      .createHash('sha256')
      .update(String(value))
      .digest('hex')
      .slice(0, 8);
  } catch {
    return 'unknown';
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  API PÚBLICA
// ────────────────────────────────────────────────────────────────────────────

/**
 * Sanitiza un objeto (body, query, params, headers) recursivamente.
 * Reemplaza cualquier valor cuya clave sea sensible por REDACTED o por un
 * hash SHA-256 truncado (modo 'hash').
 *
 * @param {*} obj                  Objeto/array/string a sanitizar.
 * @param {object} [opts]
 * @param {string} [opts.mode='redact']  'redact' | 'hash' | 'mask'.
 *                                       - redact: reemplaza por '[REDACTED]'.
 *                                       - hash:   reemplaza por '[REDACTED:sha256:xxxxxxxx]'.
 *                                       - mask:   muestra primeros 2 + '***' (solo si es string >= 4).
 * @param {WeakSet} [opts._seen]   Set interno para detectar ciclos.
 * @returns {*} Copia sanitizada del objeto.
 */
function sanitize(obj, opts = {}) {
  const mode = opts.mode || 'redact';
  const seen = opts._seen || new WeakSet();

  // Primitivos → devolver tal cual
  if (obj === null || obj === undefined) return obj;
  const type = typeof obj;
  if (type !== 'object') return obj;

  // Detección de ciclos
  if (seen.has(obj)) return '[CIRCULAR]';

  // Buffer / TypedArray → representar de forma segura
  if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) {
    return `<Buffer length=${obj.length}>`;
  }

  // Error → solo message y name (no stack con paths internos del sistema)
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      code: obj.code,
    };
  }

  // Date → toISOString (no contiene secretos)
  if (obj instanceof Date) return obj.toISOString();

  // RegExp → source (no secretos)
  if (obj instanceof RegExp) return obj.source;

  seen.add(obj);

  // Array → sanitizar cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, { mode, _seen: seen }));
  }

  // Objeto plano → sanitizar claves
  const out = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (isSensitiveKey(key)) {
      if (mode === 'hash' && typeof value === 'string' && value.length > 0) {
        out[key] = `${REDACTED_HASH_PREFIX}${shortHash(value)}]`;
      } else if (mode === 'mask' && typeof value === 'string' && value.length >= 4) {
        out[key] = `${value.slice(0, 2)}***`;
      } else {
        out[key] = REDACTED;
      }
      continue;
    }

    // Recursión segura
    if (value !== null && (typeof value === 'object' || Array.isArray(value))) {
      out[key] = sanitize(value, { mode, _seen: seen });
    } else {
      out[key] = value;
    }
  }

  return out;
}

/**
 * Sanitiza un objeto de headers HTTP (req.headers), eliminando los sensibles.
 * A diferencia de sanitize(), devuelve un objeto donde cada valor es REDACTED,
 * no la clave original — los headers tienen muchas claves con la palabra
 * 'authorization' como sub-string que no son sensibles (p. ej. custom headers).
 *
 * @param {object} headers
 * @returns {object}
 */
function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') return headers;
  const out = {};
  for (const key of Object.keys(headers)) {
    if (isSensitiveHeader(key)) {
      out[key] = REDACTED;
    } else {
      out[key] = headers[key];
    }
  }
  return out;
}

/**
 * Helper para middleware: dado un req de Express, devuelve un objeto seguro
 * para loguear (sin contraseñas, sin tokens, sin cookies).
 *
 * NO incluye req.file / req.files (pueden contener binarios grandes).
 *
 * @param {object} req
 * @param {object} [opts]
 * @param {string} [opts.mode='redact']
 * @param {boolean} [opts.includeHeaders=true]
 * @returns {object}
 */
function sanitizeRequest(req, opts = {}) {
  const mode = opts.mode || 'redact';
  const includeHeaders = opts.includeHeaders !== false;

  const safe = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get ? req.get('User-Agent') : req.headers && req.headers['user-agent'],
    body: sanitize(req.body, { mode }),
    params: sanitize(req.params, { mode }),
    query: sanitize(req.query, { mode }),
  };

  if (includeHeaders) {
    safe.headers = sanitizeHeaders(req.headers);
  }

  return safe;
}

/**
 * Verifica que una cadena NO contenga valores sensibles conocidos.
 * Útil para tests E2E: dado un string que supuestamente se logueó,
 * buscar si contiene alguno de los secretos provistos.
 *
 * @param {string} haystack
 * @param {string[]} secrets
 * @returns {{ leaked: boolean, found: string[] }}
 */
function detectLeaks(haystack, secrets) {
  if (typeof haystack !== 'string' || !Array.isArray(secrets)) {
    return { leaked: false, found: [] };
  }
  const found = secrets.filter((s) => {
    if (typeof s !== 'string' || s.length < 4) return false; // evitar falsos positivos
    return haystack.includes(s);
  });
  return { leaked: found.length > 0, found };
}

// Mantener alias para retrocompatibilidad con tests/docs existentes
const SENSITIVE_KEYS = SENSITIVE_WORDS;
const SENSITIVE_REGEX = null; // deprecated: ahora la lógica está en isSensitiveKey()

module.exports = {
  // Constantes exportadas (útiles para tests)
  SENSITIVE_WORDS,
  SENSITIVE_KEYS, // alias
  SENSITIVE_REGEX, // null, deprecated
  SENSITIVE_HEADERS,
  REDACTED,
  REDACTED_HASH_PREFIX,

  // Funciones principales
  sanitize,
  sanitizeHeaders,
  sanitizeRequest,
  detectLeaks,
  isSensitiveKey,
  isSensitiveHeader,
  normalizeKey, // exportado para tests
};
