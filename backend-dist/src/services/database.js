/**
 * Database Service Module
 * Manejo de conexiones PostgreSQL con pg
 */

const { Pool } = require('pg');
const winston = require('winston');

// Configuración de la conexión
let poolConfig;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL si está disponible (PostgreSQL local vía Docker)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  
  if (!process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  // Configuración individual para desarrollo local
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'handler_track_samples',
    user: process.env.DB_USER || 'handler_user',
    password: process.env.DB_PASSWORD || 'handler_password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

// Crear pool de conexiones
const pool = new Pool(poolConfig);

// Logger para operaciones de BD
const dbLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

// Eventos del pool
pool.on('connect', (client) => {
  dbLogger.debug('Nueva conexión a la base de datos establecida');
});

pool.on('error', (err, client) => {
  dbLogger.error('Error inesperado en el pool de conexiones:', err);
  process.exit(-1);
});

pool.on('remove', (client) => {
  dbLogger.debug('Conexión removida del pool');
});

/**
 * Ejecuta una consulta SQL con parámetros
 * @param {string} query - Consulta SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Object>} Resultado de la consulta
 */
async function query(query, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(query, params);
    const duration = Date.now() - start;
    dbLogger.debug(`Query ejecutada en ${duration}ms: ${query.substring(0, 100)}...`);
    return result;
  } catch (error) {
    dbLogger.error(`Error en query: ${error.message}`, { query, params, error: error.stack });
    throw error;
  }
}

/**
 * Ejecuta múltiples consultas en una transacción
 * @param {Array} queries - Array de objetos {query, params}
 * @returns {Promise<Array>} Resultados de las consultas
 */
async function transaction(queries) {
  const client = await pool.connect();
  const start = Date.now();

  try {
    await client.query('BEGIN');
    const results = [];

    for (const { query: sql, params = [] } of queries) {
      const result = await client.query(sql, params);
      results.push(result);
    }

    await client.query('COMMIT');
    const duration = Date.now() - start;
    dbLogger.debug(`Transacción completada en ${duration}ms (${queries.length} queries)`);

    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    dbLogger.error(`Error en transacción: ${error.message}`, { error: error.stack });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verifica la conexión a la base de datos
 * @returns {Promise<boolean>} true si la conexión es exitosa
 */
async function testConnection() {
  try {
    await pool.query('SELECT 1');
    dbLogger.info('Conexión a la base de datos verificada exitosamente');
    return true;
  } catch (error) {
    dbLogger.error('Error al conectar con la base de datos:', error.message);
    return false;
  }
}

/**
 * Cierra todas las conexiones del pool
 */
async function close() {
  await pool.end();
  dbLogger.info('Pool de conexiones cerrado');
}

// Health check para el endpoint /health
async function getHealthStatus() {
  try {
    const result = await pool.query('SELECT version(), current_database(), current_user');
    return {
      status: 'healthy',
      database: result.rows[0].current_database,
      version: result.rows[0].version.split(' ')[1],
      connections: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

module.exports = {
  query,
  transaction,
  testConnection,
  close,
  getHealthStatus,
  pool, // Para casos especiales donde se necesite acceso directo
};