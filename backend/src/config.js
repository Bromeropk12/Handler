/**
 * Configuration Module
 * Validación y gestión de variables de entorno
 */

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
  COA_BASE_DIR: 'C:/Handler/CoA',
  BCRYPT_ROUNDS: 12,
  RATE_LIMIT_WINDOW: 15,
  RATE_LIMIT_MAX_REQUESTS: 100
};

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 */
function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(`Variables de entorno requeridas faltantes: ${missing.join(', ')}`);
  }

  // Validaciones específicas
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET es muy corta. Se recomienda al menos 32 caracteres para producción.');
  }

  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'handler-track-samples-jwt-secret-key-2024-very-secure-random-string-change-in-production') {
    throw new Error('JWT_SECRET no puede usar el valor por defecto en producción');
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

  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  },

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
  }
};

// Validar configuración
validateEnvironment();

module.exports = config;