/**
 * Helper para tests de integración con PostgreSQL real.
 *
 * Por defecto los tests usan mocks de `database` (ver tests/setup.js).
 * Los tests marcados con `RUN_DB_TESTS=1` requieren un PostgreSQL real:
 *
 *   RUN_DB_TESTS=1 pnpm test
 *
 * Levanta un container Docker efímero con la imagen `postgres:15-alpine`,
 * aplica migrations, y expone helpers para `truncateAll()` y `close()`.
 *
 * Sin Docker disponible: los tests que llamen a `requireRealDb()` se
 * saltan automáticamente con un mensaje claro (no fallan).
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB_NAME = 'handler_test';
const DB_USER = 'handler_test';
const DB_PASSWORD = 'handler_test_pwd';
const CONTAINER_NAME = 'handler-test-pg';
const PG_PORT = 5433;
const MIGRATIONS_DIR = path.resolve(__dirname, '..', '..', '..', 'database', 'scripts');

let activeClient = null;
let containerStartedHere = false;

function isRealDbEnabled() {
  return process.env.RUN_DB_TESTS === '1';
}

function isDockerAvailable() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch (_) {
    return false;
  }
}

async function startContainer() {
  try {
    execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: 'ignore' });
  } catch (_) {}
  execSync(
    `docker run -d --name ${CONTAINER_NAME} -p ${PG_PORT}:5432 ` +
      `-e POSTGRES_USER=${DB_USER} -e POSTGRES_PASSWORD=${DB_PASSWORD} ` +
      `-e POSTGRES_DB=${DB_NAME} postgres:15-alpine`,
    { stdio: 'inherit' }
  );
  containerStartedHere = true;
  await waitForPg();
}

async function waitForPg(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const c = new Client({
        host: '127.0.0.1',
        port: PG_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: 'postgres',
      });
      await c.connect();
      await c.query('SELECT 1');
      await c.end();
      return;
    } catch (_) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('PostgreSQL no arrancó a tiempo');
}

async function applyMigrations() {
  const client = new Client({
    host: '127.0.0.1',
    port: PG_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });
  await client.connect();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await client.query(sql);
  }

  await client.end();
}

async function truncateAll() {
  if (!activeClient) throw new Error('requireRealDb() no fue llamado');
  const tables = [
    'movements', 'dispensed_samples', 'global_samples', 'shelf_suppliers',
    'shelves', 'suppliers', 'market_lines', 'users',
  ];
  for (const t of tables) {
    await activeClient.query(`TRUNCATE TABLE ${t} CASCADE`);
  }
}

async function requireRealDb() {
  if (!isRealDbEnabled()) {
    throw new Error(
      'Test requiere RUN_DB_TESTS=1. Set la variable y asegurate de tener Docker.'
    );
  }
  if (!isDockerAvailable()) {
    throw new Error('Docker no está disponible en este sistema');
  }

  if (!activeClient) {
    await startContainer();
    await applyMigrations();
    activeClient = new Client({
      host: '127.0.0.1',
      port: PG_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });
    await activeClient.connect();

    if (typeof afterAll === 'function') {
      afterAll(async () => {
        if (activeClient) {
          await activeClient.end();
          activeClient = null;
        }
        if (containerStartedHere) {
          try {
            execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: 'ignore' });
          } catch (_) {}
        }
      });
    }
  }

  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = String(PG_PORT);
  process.env.DB_USER = DB_USER;
  process.env.DB_PASSWORD = DB_PASSWORD;
  process.env.DB_NAME = DB_NAME;

  return activeClient;
}

module.exports = {
  requireRealDb,
  truncateAll,
  isRealDbEnabled,
  isDockerAvailable,
};
