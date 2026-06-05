/**
 * Backup Controller - Handler TrackSamples
 * Guarda backups en 3 destinos:
 *   1. Base de datos local (para listar/restaurar desde la app)
 *   2. Carpeta Handler/backups/ en la raíz del proyecto
 *   3. OneDrive/Handler_backups/ (si OneDrive está disponible)
 */

const fs    = require('fs');
const path  = require('path');
const bcrypt = require('bcryptjs');
const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

// ─────────────────────────────────────────
//  CONFIGURACIÓN
// ─────────────────────────────────────────
const MAX_BACKUPS = 3;

// Carpeta raíz del proyecto: Handler/
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
// Carpeta local de backups: Handler/backups/
const LOCAL_BACKUP_DIR = path.join(PROJECT_ROOT, 'backups');

// ─────────────────────────────────────────
//  UTILIDADES DE RUTAS
// ─────────────────────────────────────────

/**
 * Detecta la ruta de OneDrive desde variables de entorno de Windows.
 * Devuelve null si no está disponible.
 */
const getOneDrivePath = () => {
  const onedrive =
    process.env.OneDriveConsumer ||
    process.env.OneDrive ||
    process.env.ONEDRIVE ||
    null;
  return onedrive ? path.join(onedrive, 'Handler_backups') : null;
};

/**
 * Asegura que un directorio exista (crea recursivamente si no)
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[BACKUP] Carpeta creada: ${dir}`);
  }
};

/**
 * Genera nombre de archivo de backup con timestamp Bogotá
 */
const generateBackupFilename = () => {
  const now = new Date();
  const bogota = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const ts = bogota.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `backup_handler_${ts}.json`;
};

/**
 * Escribe el JSON del backup en un directorio dado.
 * Devuelve { success, path, error }
 */
const writeBackupFile = (dir, filename, jsonStr) => {
  try {
    ensureDir(dir);
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, jsonStr, 'utf8');
    return { success: true, path: filePath };
  } catch (err) {
    console.error(`[BACKUP] Error escribiendo en ${dir}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Rota archivos: elimina los más antiguos si superan MAX_BACKUPS en el dir.
 */
const rotateFiles = (dir) => {
  try {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('backup_handler_') && f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS) {
      files.slice(MAX_BACKUPS).forEach(f => {
        try { fs.unlinkSync(path.join(dir, f.name)); } catch (_) {}
        console.log(`[BACKUP] Archivo antiguo eliminado: ${f.name}`);
      });
    }
  } catch (err) {
    console.error(`[BACKUP] Error rotando archivos en ${dir}:`, err.message);
  }
};

/**
 * Exportar todas las tablas de la BD a un objeto JSON
 */
const exportDatabaseToJSON = async () => {
  const tables = [
    'users',
    'global_samples',
    'dispensed_samples',
    'shelves',
    'shelf_suppliers',
    'suppliers',
    'market_lines',
    'movements',
  ];

  const data = {
    version: '2.0',
    generatedAt: new Date().toISOString(),
    timezone: 'America/Bogota',
    tables: {},
    metadata: {
      generatedBy: 'Handler TrackSamples Backup System',
      description: 'Backup completo de la base de datos',
    },
  };

// Tablas que NO tienen columna created_at
const NO_CREATED_AT = new Set(['shelf_suppliers', 'movements']);

for (const table of tables) {
    try {
      const orderBy = NO_CREATED_AT.has(table) ? '' : 'ORDER BY created_at NULLS LAST';
      const result = await query(`SELECT * FROM ${table} ${orderBy}`);
      data.tables[table] = result.rows;
    } catch (err) {
      data.tables[table] = [];
    }
  }
  return data;
};

// ─────────────────────────────────────────
//  TABLA BD
// ─────────────────────────────────────────
const ensureBackupTables = async () => {
  await query(`
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
  `);

  // Añadir columnas si el esquema es antiguo (sin local_path / onedrive_path)
  const cols = await query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'backups' AND column_name IN ('local_path', 'onedrive_path')
  `);
  const existing = cols.rows.map(r => r.column_name);
  if (!existing.includes('local_path')) {
    await query(`ALTER TABLE backups ADD COLUMN IF NOT EXISTS local_path VARCHAR(1000)`);
  }
  if (!existing.includes('onedrive_path')) {
    await query(`ALTER TABLE backups ADD COLUMN IF NOT EXISTS onedrive_path VARCHAR(1000)`);
  }
};

// ─────────────────────────────────────────
//  FUNCIÓN CENTRAL DE ESCRITURA DE BACKUP
// ─────────────────────────────────────────

/**
 * Ejecuta el backup completo:
 *   1. Exporta la BD a JSON
 *   2. Guarda en Handler/backups/
 *   3. Guarda en OneDrive/Handler_backups/ (si disponible)
 *   4. Guarda en tabla backups de la BD
 * Devuelve { filename, sizeBytes, localResult, onedriveResult }
 */
const performBackup = async (createdBy, manual = false) => {
  await ensureBackupTables(); // Garantiza que las columnas local_path y onedrive_path existen
  const filename = generateBackupFilename();
  const data     = await exportDatabaseToJSON();
  data.createdBy = createdBy;
  data.manual    = manual;

  const jsonStr  = JSON.stringify(data, null, 2);
  const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');

  // 1. Guardar localmente en Handler/backups/
  const localResult = writeBackupFile(LOCAL_BACKUP_DIR, filename, jsonStr);
  rotateFiles(LOCAL_BACKUP_DIR);

  // 2. Guardar en OneDrive (si existe)
  const oneDriveDir = getOneDrivePath();
  let onedriveResult = { success: false, path: null, error: 'OneDrive no detectado' };
  if (oneDriveDir) {
    onedriveResult = writeBackupFile(oneDriveDir, filename, jsonStr);
    rotateFiles(oneDriveDir);
  }

  // 3. Guardar en base de datos local
  await query(
    `INSERT INTO backups (filename, size_bytes, data, created_by, manual, local_path, onedrive_path)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)`,
    [
      filename,
      sizeBytes,
      jsonStr,
      createdBy,
      manual,
      localResult.success ? localResult.path : null,
      onedriveResult.success ? onedriveResult.path : null,
    ]
  );

  // 4. Rotar en BD
  const allBackups = await query('SELECT id FROM backups ORDER BY created_at DESC');
  if (allBackups.rows.length > MAX_BACKUPS) {
    const toDelete = allBackups.rows.slice(MAX_BACKUPS);
    for (const old of toDelete) {
      await query('DELETE FROM backups WHERE id = $1', [old.id]);
    }
  }

  return { filename, sizeBytes, localResult, onedriveResult };
};

// ─────────────────────────────────────────
//  CONTROLADORES HTTP
// ─────────────────────────────────────────

/**
 * GET /api/backup/list
 */
const listBackups = async (req, res, next) => {
  try {
    await ensureBackupTables();

    const result = await query(
      `SELECT id, filename, size_bytes, created_by, manual, local_path, onedrive_path, created_at
       FROM backups ORDER BY created_at DESC LIMIT 10`
    );

    const backups = result.rows.map((b, i) => ({
      id: b.id,
      filename: b.filename,
      sizeMB: b.size_bytes ? (b.size_bytes / 1024 / 1024).toFixed(2) : '—',
      createdAt: b.created_at,
      createdBy: b.created_by,
      manual: b.manual,
      localPath: b.local_path || null,
      onedrivePath: b.onedrive_path || null,
      isOldest: i === result.rows.length - 1,
    }));

    let intervalDays = 20;
    let hour = 12;
    try {
      const configRes = await query("SELECT value FROM settings WHERE key = 'backup_config'");
      if (configRes.rows.length > 0) {
        intervalDays = configRes.rows[0].value.interval_days || 20;
        hour = configRes.rows[0].value.hour || 12;
      }
    } catch (_) {}

    let nextBackup = null;
    if (backups.length > 0) {
      const last = new Date(backups[0].createdAt);
      const next = new Date(last.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      next.setUTCHours(hour + 5, 0, 0, 0);
      nextBackup = next.toISOString();
    }

    const oneDriveDir = getOneDrivePath();

    res.json({
      success: true,
      data: {
        backups,
        maxBackups: MAX_BACKUPS,
        intervalDays,
        nextBackupScheduled: nextBackup,
        totalBackups: backups.length,
        storageType: 'local-file + db' + (oneDriveDir ? ' + onedrive' : ''),
        localBackupDir: LOCAL_BACKUP_DIR,
        oneDriveDir: oneDriveDir || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/backup/create
 */
const createBackup = async (req, res, next) => {
  try {
    await ensureBackupTables();

    const { filename, sizeBytes, localResult, onedriveResult } = await performBackup(
      req.user.username,
      true
    );

    // Log en movements
    try {
      await query(
        'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
        [null, 'backup_created', req.user.id, JSON.stringify({
          filename,
          sizeMB: (sizeBytes / 1024 / 1024).toFixed(2),
          localSaved: localResult.success,
          onedriveSaved: onedriveResult.success,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        })]
      );
    } catch (_) {}

    res.json({
      success: true,
      message: 'Backup creado exitosamente',
      data: {
        filename,
        sizeMB: (sizeBytes / 1024 / 1024).toFixed(2),
        createdAt: new Date().toISOString(),
        local: {
          saved: localResult.success,
          path: localResult.success ? localResult.path : null,
          error: localResult.error || null,
        },
        onedrive: {
          saved: onedriveResult.success,
          path: onedriveResult.success ? onedriveResult.path : null,
          error: onedriveResult.error || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/backup/restore
 */
const restoreBackup = async (req, res, next) => {
  const { pool } = require('../../services/database');
  const client = await pool.connect();

  try {
    const { filename, password } = req.body;

    if (!filename || !password) {
      throw new AppError('Nombre de archivo y contraseña son requeridos', 400);
    }

    // Verificar contraseña del admin
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    if (userResult.rows.length === 0) throw new AppError('Usuario no encontrado', 404);

    const isValid = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!isValid) throw new AppError('Contraseña incorrecta. La restauración fue cancelada por seguridad.', 401);

    // Buscar backup — primero en BD, luego en disco local
    let backupData = null;

    const dbResult = await query('SELECT data FROM backups WHERE filename = $1', [filename]);
    if (dbResult.rows.length > 0) {
      backupData = dbResult.rows[0].data;
    } else {
      // Intentar leer desde archivo local
      const localFile = path.join(LOCAL_BACKUP_DIR, filename);
      if (fs.existsSync(localFile)) {
        backupData = JSON.parse(fs.readFileSync(localFile, 'utf8'));
      }
    }

    if (!backupData) throw new AppError('Backup no encontrado en base de datos ni en carpeta local', 404);

    // Compatibilidad hacia atrás
    if (backupData.tables) {
      if (!backupData.tables['global_samples'] && backupData.tables['samples']) {
        backupData.tables['global_samples'] = backupData.tables['samples'];
        delete backupData.tables['samples'];
      }
    }

    const GENERATED_COLUMNS = { shelves: ['total_capacity'] };
    const restoreOrder = [
      'users', 'market_lines', 'suppliers', 'shelves',
      'shelf_suppliers', 'global_samples', 'dispensed_samples', 'movements',
    ];

    const stats = { restored: {}, skipped: [], errors: [] };

    await client.query('BEGIN');

    for (const table of restoreOrder) {
      const rows = backupData.tables?.[table];
      if (!rows || rows.length === 0) { stats.skipped.push(table); continue; }

      const tableExists = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
        [table]
      );
      if (!tableExists.rows[0].exists) { stats.skipped.push(`${table} (no existe en BD)`); continue; }

      await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

      let insertedCount = 0;
      for (const rawRow of rows) {
        const row = { ...rawRow };
        const generatedCols = GENERATED_COLUMNS[table] || [];
        for (const col of generatedCols) delete row[col];

        const cols = Object.keys(row);
        if (cols.length === 0) continue;

        const vals = Object.values(row);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');

        await client.query(
          `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          vals
        );
        insertedCount++;
      }
      stats.restored[table] = insertedCount;
    }

    await client.query('COMMIT');

    try {
      await query(
        'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
        [null, 'backup_restored', req.user.id, JSON.stringify({
          filename,
          backupDate: backupData.generatedAt,
          stats, ip: req.ip, timestamp: new Date().toISOString(),
        })]
      );
    } catch (_) {}

    res.json({
      success: true,
      message: `Base de datos restaurada exitosamente desde ${filename}`,
      data: { stats, backupDate: backupData.generatedAt },
    });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    next(error);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/backup/:filename
 */
const deleteBackup = async (req, res, next) => {
  try {
    const { filename } = req.params;

    // Eliminar de BD y obtener rutas de archivo
    const result = await query(
      'DELETE FROM backups WHERE filename = $1 RETURNING id, local_path, onedrive_path',
      [filename]
    );

    if (result.rows.length > 0) {
      const { local_path, onedrive_path } = result.rows[0];
      // Eliminar archivos físicos si existen
      if (local_path && fs.existsSync(local_path)) {
        try { fs.unlinkSync(local_path); } catch (_) {}
      }
      if (onedrive_path && fs.existsSync(onedrive_path)) {
        try { fs.unlinkSync(onedrive_path); } catch (_) {}
      }
    } else {
      // Puede ser que solo exista el archivo sin registro en BD
      const localFile = path.join(LOCAL_BACKUP_DIR, filename);
      if (!fs.existsSync(localFile)) throw new AppError('Backup no encontrado', 404);
      fs.unlinkSync(localFile);
    }

    res.json({ success: true, message: `Backup "${filename}" eliminado exitosamente` });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/backup/status
 */
const getBackupStatus = async (req, res, next) => {
  try {
    await ensureBackupTables();

    const result = await query('SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1');
    const countResult = await query('SELECT COUNT(*) FROM backups');

    const now = new Date();
    let intervalDays = 20;
    let hour = 12;
    try {
      const configRes = await query("SELECT value FROM settings WHERE key = 'backup_config'");
      if (configRes.rows.length > 0) {
        intervalDays = configRes.rows[0].value.interval_days || 20;
        hour = configRes.rows[0].value.hour || 12;
      }
    } catch (_) {}

    let daysSinceLast = null;
    let isDue = true;

    if (result.rows.length > 0) {
      const ms = now.getTime() - new Date(result.rows[0].created_at).getTime();
      daysSinceLast = Math.floor(ms / (1000 * 60 * 60 * 24));
      isDue = daysSinceLast >= intervalDays;
    }

    const oneDriveDir = getOneDrivePath();

    // Verificar estado real de las carpetas
    const localOk = fs.existsSync(LOCAL_BACKUP_DIR);
    const onedriveOk = oneDriveDir && fs.existsSync(oneDriveDir);

    res.json({
      success: true,
      data: {
        totalBackups: parseInt(countResult.rows[0].count),
        maxBackups: MAX_BACKUPS,
        intervalDays,
        hour,
        isDue,
        daysSinceLast,
        lastBackup: result.rows.length > 0 ? result.rows[0].created_at : null,
        storage: {
          localDir: LOCAL_BACKUP_DIR,
          localReady: localOk,
          onedriveDir: oneDriveDir || null,
          onedriveReady: !!onedriveOk,
        },
        schedulerInfo: `Backup automático cada ${intervalDays} días a las ${hour}:00 hora Bogotá`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stub OneDrive (ahora funciona — mantener por compatibilidad de ruta)
 */
const syncToOneDrive = async (req, res) => {
  const oneDriveDir = getOneDrivePath();
  if (!oneDriveDir) {
    return res.json({
      success: false,
      message: 'OneDrive no detectado en este sistema. Los backups se guardan localmente en Handler/backups/',
    });
  }
  res.json({
    success: true,
    message: `Los backups se sincronizan automáticamente a ${oneDriveDir}`,
  });
};

/**
 * GET /api/backup/settings
 */
const getSettings = async (req, res, next) => {
  try {
    await ensureBackupTables();
    const configRes = await query("SELECT value FROM settings WHERE key = 'backup_config'");
    const config = configRes.rows.length > 0 ? configRes.rows[0].value : { interval_days: 20, hour: 12 };

    const oneDriveDir = getOneDrivePath();
    res.json({
      success: true,
      data: {
        ...config,
        localBackupDir: LOCAL_BACKUP_DIR,
        oneDriveDir: oneDriveDir || null,
        oneDriveAvailable: !!oneDriveDir,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/backup/settings
 */
const updateSettings = async (req, res, next) => {
  try {
    const { interval_days, hour } = req.body;
    if (!interval_days || typeof interval_days !== 'number' || interval_days < 1) {
      throw new AppError('interval_days debe ser un número positivo', 400);
    }
    if (typeof hour !== 'number' || hour < 0 || hour > 23) {
      throw new AppError('hour debe estar entre 0 y 23', 400);
    }

    const value = JSON.stringify({ interval_days, hour });
    await query(`
      INSERT INTO settings (key, value)
      VALUES ('backup_config', $1::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = CURRENT_TIMESTAMP
    `, [value]);

    res.json({ success: true, message: 'Configuración guardada exitosamente' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/backup/cron — endpoint interno para trigger de cron
 */
const runCronJob = async (req, res, next) => {
  try {
    let intervalDays = 20;
    try {
      const configRes = await query("SELECT value FROM settings WHERE key = 'backup_config'");
      if (configRes.rows.length > 0) intervalDays = configRes.rows[0].value.interval_days || 20;
    } catch (_) {}

    const result = await query('SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1');
    if (result.rows.length > 0) {
      const daysSinceLast = (Date.now() - new Date(result.rows[0].created_at)) / (1000 * 60 * 60 * 24);
      if (daysSinceLast < intervalDays) {
        return res.json({ success: true, message: `Aún no han pasado ${intervalDays} días desde el último backup.` });
      }
    }

    const { filename } = await performBackup('sistema-cron', false);
    return res.json({ success: true, message: 'Backup automático generado', filename });
  } catch (err) {
    console.error('[CRON] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  listBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  syncToOneDrive,
  getBackupStatus,
  getSettings,
  updateSettings,
  runCronJob,
  performBackup,      // Exportada para uso en backupScheduler
  LOCAL_BACKUP_DIR,
  getOneDrivePath,
};
