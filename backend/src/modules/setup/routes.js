/**
 * Setup Route — Handler TrackSamples
 * Endpoint activo SOLO cuando SETUP_MODE=true (sin .env configurado).
 * Después de una configuración exitosa, se bloquea permanentemente.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const programDataPath = path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'HandlerTrackSamples');

// Middleware: bloquear si ya está configurado (pero permitir reconfig desde localhost si DB caída)
router.use(async (req, res, next) => {
  if (process.env.SETUP_MODE !== 'true') {
    // Solo POST desde localhost: permitir reconfiguración si la BD no responde
    if (req.method === 'POST') {
      const clientIp = req.ip || req.connection.remoteAddress;
      const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1';
      if (isLocal) {
        try {
          const database = require('../../services/database');
          const connected = await database.testConnection();
          if (!connected) return next();
        } catch (_) { return next(); }
      }
    }
    return res.status(403).json({
      success: false,
      error: 'El sistema ya está configurado. Este endpoint está deshabilitado.'
    });
  }
  next();
});

// GET /setup — Servir la página web de configuración
router.get('/', (req, res) => {
  const setupPage = path.join(__dirname, '../../setup_page.html');
  if (fs.existsSync(setupPage)) {
    res.sendFile(setupPage);
  } else {
    res.send('<h1>Setup page not found</h1>');
  }
});

// POST /api/setup — Procesar la configuración inicial
router.post('/', async (req, res) => {
  const { host, port, user, password, dbName, adminName, adminUsername, adminPassword } = req.body;

  // ─── Validaciones ────────────────────────────────────────
  if (!host || !port || !user || !password || !dbName) {
    return res.status(400).json({ success: false, error: 'Todos los campos de base de datos son obligatorios.' });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    return res.status(400).json({ success: false, error: 'El nombre de base de datos solo puede contener letras, números y guiones bajos.' });
  }

  if (!adminUsername || !adminPassword || adminPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'Usuario y contraseña de administrador requeridos (mínimo 8 caracteres).' });
  }

  // ─── Verificar conexión a PostgreSQL ─────────────────────
  const client = new Client({ host, port: parseInt(port), user, password, database: 'postgres' });

  try {
    await client.connect();

    // Crear DB si no existe
    const dbCheck = await client.query('SELECT datname FROM pg_catalog.pg_database WHERE datname = $1', [dbName]);
    if (dbCheck.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[SETUP] Base de datos "${dbName}" creada.`);
    }

    await client.end();
  } catch (err) {
    try { await client.end(); } catch (_) {}
    return res.status(500).json({ success: false, error: `Error de conexión a PostgreSQL: ${err.message}` });
  }

  // ─── Generar JWT_SECRET criptográfico ────────────────────
  const jwtSecret = crypto.randomBytes(48).toString('hex');
  const dbUrl = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;

  // ─── Escribir .env en ProgramData ────────────────────────
  // Detectar OneDrive para que el backup scheduler pueda sincronizar.
  // Prioridad: OneDriveConsumer > OneDrive > null (no detectado).
  const oneDriveBase =
    process.env.OneDriveConsumer ||
    process.env.OneDrive ||
    null;
  const oneDriveDir = oneDriveBase
    ? path.join(oneDriveBase, 'Handler_backups')
    : '';
  const envContent = [
    'NODE_ENV=production',
    'PORT=3001',
    `DATABASE_URL=${dbUrl}`,
    `DB_HOST=${host}`,
    `DB_PORT=${port}`,
    `DB_NAME=${dbName}`,
    `DB_USER=${user}`,
    `DB_PASSWORD=${password}`,
    `JWT_SECRET=${jwtSecret}`,
    'JWT_EXPIRES_IN=8h',
    'LOG_LEVEL=info',
    'RATE_LIMIT_WINDOW=15',
    'RATE_LIMIT_MAX_REQUESTS=5000',
    ...(oneDriveDir ? [`ONE_DRIVE_DIR=${oneDriveDir}`] : []),
  ].join('\n') + '\n';

  try {
    if (!fs.existsSync(programDataPath)) {
      fs.mkdirSync(programDataPath, { recursive: true });
    }
    fs.writeFileSync(path.join(programDataPath, '.env'), envContent, 'utf8');
    console.log(`[SETUP] Archivo .env escrito en: ${path.join(programDataPath, '.env')}`);
  } catch (err) {
    return res.status(500).json({ success: false, error: `Error escribiendo .env: ${err.message}` });
  }

  // ─── HTTPS deshabilitado en LAN ────────────────────────────
  // Los certs autofirmados bloquean los navegadores y no aportan
  // seguridad real en una red privada. Si en el futuro se requiere
  // HTTPS, integrar Let's Encrypt o un cert válido por dominio.
  // ───────────────────────────────────────────────────────────

  // ─── Ejecutar migraciones con Client dedicado ────────────
  // IMPORTANTE: NO usar el pool global (services/database.js), porque fue
  // pre-cargado al inicio del proceso con defaults `handler_user`/`handler_password`
  // cuando el `.env` aún no existía. Usamos un Client nuevo con las credenciales
  // que el usuario acaba de proporcionar en el formulario.
  let migrationClient;
  try {
    migrationClient = new Client({ host, port: parseInt(port), user, password, database: dbName });
    await migrationClient.connect();

    // Crear tabla de control de migraciones
    await migrationClient.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Leer y aplicar migraciones pendientes
    const scriptsDir = path.join(__dirname, '../../../../database/scripts');
    if (fs.existsSync(scriptsDir)) {
      const executedResult = await migrationClient.query('SELECT name FROM schema_migrations');
      const executedSet = new Set(executedResult.rows.map(r => r.name));
      const migrationFiles = fs.readdirSync(scriptsDir)
        .filter(f => f.startsWith('migration-') && f.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        if (executedSet.has(file)) continue;
        const sql = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
        try {
          await migrationClient.query('BEGIN');
          await migrationClient.query(sql);
          await migrationClient.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
          await migrationClient.query('COMMIT');
          console.log(`[SETUP] Migración aplicada: ${file}`);
        } catch (err) {
          await migrationClient.query('ROLLBACK');
          throw err;
        }
      }
    }

    // Crear tablas base embebidas (backups + settings)
    await migrationClient.query(`
      CREATE TABLE IF NOT EXISTS backups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        size_bytes BIGINT NOT NULL,
        created_by VARCHAR(50),
        manual BOOLEAN DEFAULT false,
        local_path VARCHAR(1000),
        onedrive_path VARCHAR(1000),
        data JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO settings (key, value)
        VALUES ('backup_config', '{"interval_days": 20, "hour": 12}'::jsonb)
        ON CONFLICT (key) DO NOTHING;
    `);

    console.log('[SETUP] Tablas base creadas/verificadas.');

    // ─── Crear o actualizar usuario administrador inicial ─
    // La migration SQL (migration-001) inserta un admin default con password 'admin123'.
    // Si ya existe, actualizamos su password al elegido en setup para que el wizard
    // siempre tenga efecto, incluso en reinstalaciones sobre DB existente.
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const secretHash = crypto.randomBytes(32).toString('hex');
    const existing = await migrationClient.query("SELECT id FROM users WHERE username = $1", [adminUsername]);
    if (existing.rows.length === 0) {
      await migrationClient.query(
        `INSERT INTO users (username, password_hash, secret_password_hash, role, permissions)
         VALUES ($1, $2, $3, 'admin'::user_role, $4::jsonb)`,
        [adminUsername, hashedPassword, secretHash, JSON.stringify({ all: true })]
      );
      console.log(`[SETUP] Administrador "${adminUsername}" creado.`);
    } else {
      await migrationClient.query(
        `UPDATE users SET password_hash = $1, secret_password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE username = $3`,
        [hashedPassword, secretHash, adminUsername]
      );
      console.log(`[SETUP] Administrador "${adminUsername}" actualizado (password actualizado al valor del wizard).`);
    }

    await migrationClient.end();
  } catch (err) {
    try { if (migrationClient) await migrationClient.end(); } catch (_) {}
    return res.status(500).json({ success: false, error: `Error ejecutando migraciones: ${err.message}` });
  }

  // ─── Confirmar éxito ─────────────────────────────────────
  res.json({
    success: true,
    message: 'Configuración completada. El servidor se reiniciará en unos segundos.',
    dbName
  });

  // Reiniciar el proceso después de responder para que NSSM lo levante de nuevo
  setTimeout(() => {
    console.log('[SETUP] Reiniciando servicio para aplicar configuración...');
    process.exit(0);
  }, 1500);
});

module.exports = router;
