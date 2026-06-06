/**
 * Configuration Module
 * Validación y gestión de variables de entorno
 */

const crypto = require('crypto');

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'JWT_SECRET',
  'DATABASE_URL'
];

const optionalEnvVars = {
  FRONTEND_URL: 'http://localhost:3000',
  JWT_EXPIRES_IN: '8h',
  LOG_LEVEL: 'info',
  MAX_FILE_SIZE: '10485760',
  UPLOAD_DIR: 'uploads',
  COA_BASE_DIR: 'uploads/coa',
  BCRYPT_ROUNDS: 12,
  RATE_LIMIT_WINDOW: 15,
  RATE_LIMIT_MAX_REQUESTS: 5000
};

// Secretos conocidos como inseguros. Se rechazan en TODOS los entornos.
const KNOWN_WEAK_SECRETS = new Set([
  'handler-track-samples-jwt-secret-key-2024-very-secure-random-string-change-in-production',
  'handler-track-samples-jwt-secret-key-local-2026-cambiar-en-produccion',
  'secret',
  'changeme',
  'jwt_secret',
  'mysecret',
  'supersecret',
  '',
]);

// (C1) Secretos que fueron committed al repo o aparecen en logs/screenshots.
// Estos se rechazan SIEMPRE, en cualquier entorno, con un mensaje que indica
// que fueron comprometidos. El operador DEBE rotarlos.
const KNOWN_LEAKED_SECRETS = new Set([
  '3b11654d5476821fcd02ff752b71aa943776bc4c070a54940cc0a652f1fe1fb8fdece45aa3c1fed44af36fa57193f036',
  'handler-track-samples-jwt-secret-key-2024-very-secure-random-string-change-in-production',
  'handler-track-samples-jwt-secret-key-local-2026-cambiar-en-produccion',
]);

// Passwords de BD conocidas/débiles. Rechazadas en producción.
const KNOWN_WEAK_DB_PASSWORDS = new Set([
  '',
  'password',
  'postgres',
  'admin',
  'handler',
  'handler_password',
  'handler123',
  'changeme',
  'root',
  '12345678',
]);

const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 * y que el JWT_SECRET sea criptográficamente fuerte.
 */
function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.warn(`⚠️ [SETUP] Variables de entorno faltantes: ${missing.join(', ')}.`);
    console.warn('⚠️ [SETUP] Iniciando servidor en "Modo Setup Web" para su configuración inicial.');
    process.env.SETUP_MODE = 'true';
    return;
  }

  // ─── Validación estricta de JWT_SECRET (en todos los entornos) ───
  const secret = process.env.JWT_SECRET || '';

  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET demasiado corto (${secret.length} chars). Mínimo requerido: ${MIN_JWT_SECRET_LENGTH}. ` +
      `Genera uno con: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
    );
  }

  if (KNOWN_WEAK_SECRETS.has(secret)) {
    throw new Error(
      `JWT_SECRET es un valor conocido/débil. Esto permite a cualquier atacante forjar tokens. ` +
      `Genera uno nuevo: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
    );
  }

  // (C1) Si el secret está en KNOWN_LEAKED_SECRETS, fue expuesto públicamente
  // y debe ser rotado de inmediato. Mensaje claro para que el operador entienda
  // que es un incidente, no solo "secret débil".
  if (KNOWN_LEAKED_SECRETS.has(secret)) {
    throw new Error(
      `JWT_SECRET fue comprometido (aparece en el repositorio/git history). ` +
      `ROTA DE INMEDIATO: genera uno nuevo con ` +
      `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))" ` +
      `y actualiza el .env del servidor.`
    );
  }

  // Detectar secretos de baja entropía (todos hex/charset predecible)
  const uniqueChars = new Set(secret).size;
  if (uniqueChars < 16) {
    console.warn(
      `⚠️  [SECURITY] JWT_SECRET tiene baja entropía (${uniqueChars} caracteres únicos). ` +
      `Recomendado: cadena aleatoria criptográfica de 64+ chars hex/base64.`
    );
  }

  // (C1) Validar DB_PASSWORD contra lista de passwords conocidos/débiles.
  // Solo en producción (en dev/test se permite cualquier cosa).
  if (process.env.NODE_ENV === 'production') {
    const dbPass = process.env.DB_PASSWORD || '';
    if (KNOWN_WEAK_DB_PASSWORDS.has(dbPass)) {
      throw new Error(
        `DB_PASSWORD es un valor conocido/débil o está vacío. ` +
        `Usa una contraseña aleatoria de al menos 16 caracteres.`
      );
    }
  }

  // Log de éxito solo en desarrollo (no exponer en prod)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CONFIG] ✓ JWT_SECRET validado (${secret.length} chars, ${uniqueChars} únicos).`);
  }
}

/**
 * Obtiene configuración con valores por defecto
 */
const config = {
  // Server
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),
  frontendUrl: process.env.FRONTEND_URL || optionalEnvVars.FRONTEND_URL,

  // Database
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || optionalEnvVars.JWT_EXPIRES_IN
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || optionalEnvVars.LOG_LEVEL
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || parseInt(optionalEnvVars.MAX_FILE_SIZE, 10),
    uploadDir: process.env.UPLOAD_DIR || optionalEnvVars.UPLOAD_DIR
  },

  // CoA Directory
  coa: {
    baseDir: process.env.COA_BASE_DIR || optionalEnvVars.COA_BASE_DIR
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || optionalEnvVars.BCRYPT_ROUNDS
  },

  // Rate Limiting
  rateLimit: {
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW, 10) || optionalEnvVars.RATE_LIMIT_WINDOW) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || optionalEnvVars.RATE_LIMIT_MAX_REQUESTS
  },

  // (H3) CORS whitelist explícita.
  // Si ALLOWED_ORIGINS está definido, SOLO se aceptan esos orígenes (fail-closed).
  // Si NO está definido, se usa el set de defaults seguros (localhost/127.0.0.1
  // + IPs privadas RFC1918 con puerto 3000/3001/3002/5173 — los más comunes para
  // dev). El operador puede extender la lista via env var.
  allowedOrigins: (() => {
    const fromEnv = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (fromEnv.length > 0) return new Set(fromEnv);

    const defaults = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5173',
    ];
    // Si NODE_ENV es development, también aceptar IPs privadas en puertos comunes.
    // En producción, fail-closed a los defaults de localhost.
    if (process.env.NODE_ENV === 'development') {
      // Añadir wildcards para dev LAN (se validan por prefijo en el middleware)
      defaults.push('http://10.', 'http://172.', 'http://192.168.');
    }
    return new Set(defaults);
  })()
};

module.exports = config;
module.exports.validateEnvironment = validateEnvironment;