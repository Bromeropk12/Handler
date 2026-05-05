/**
 * Backup Controller - Handler TrackSamples
 * Sistema de respaldo de base de datos
 * Compatible con entornos locales y de escritorio
 */

const bcrypt = require('bcryptjs');
const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

// ─────────────────────────────────────────
//  CONFIGURACIÓN
// ─────────────────────────────────────────
const MAX_BACKUPS = 3;          // Máximo 3 backups → ~60 días

// ─────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────

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

  for (const table of tables) {
    try {
      const result = await query(`SELECT * FROM ${table} ORDER BY created_at NULLS LAST`);
      data.tables[table] = result.rows;
    } catch (err) {
      data.tables[table] = [];
    }
  }
  return data;
};

// ─────────────────────────────────────────
//  CONTROLADORES HTTP
// ─────────────────────────────────────────

/**
 * GET /api/backup/list
 */
const listBackups = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, filename, size_bytes, created_by, manual, created_at FROM backups ORDER BY created_at DESC LIMIT 10'
    );

    const backups = result.rows.map((b, i) => ({
      id: b.id,
      filename: b.filename,
      sizeMB: b.size_bytes ? (b.size_bytes / 1024 / 1024).toFixed(2) : '—',
      createdAt: b.created_at,
      createdBy: b.created_by,
      manual: b.manual,
      isOldest: i === result.rows.length - 1,
    }));

    // Leer config
    let intervalDays = 20;
    let hour = 12;
    try {
      const configRes = await query("SELECT value FROM settings WHERE key = 'backup_config'");
      if (configRes.rows.length > 0) {
        intervalDays = configRes.rows[0].value.interval_days || 20;
        hour = configRes.rows[0].value.hour || 12;
      }
    } catch (_) {}

    // Calcular próximo backup
    let nextBackup = null;
    if (backups.length > 0) {
      const last = new Date(backups[0].createdAt);
      const next = new Date(last.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      next.setUTCHours(hour + 5, 0, 0, 0); // Ajustar a UTC usando hora local (Bogotá UTC-5)
      nextBackup = next.toISOString();
    }

    res.json({
      success: true,
      data: {
        backups,
        maxBackups: MAX_BACKUPS,
        intervalDays: intervalDays,
        nextBackupScheduled: nextBackup,
        totalBackups: backups.length,
        storageType: 'supabase-cloud',
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
    const filename = generateBackupFilename();

    // Exportar BD
    const data = await exportDatabaseToJSON();
    data.createdBy = req.user.username;
    data.manual = true;

    const jsonStr = JSON.stringify(data);
    const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');

    // Guardar en Supabase
    await query(
      'INSERT INTO backups (filename, size_bytes, data, created_by, manual) VALUES ($1, $2, $3::jsonb, $4, $5)',
      [filename, sizeBytes, jsonStr, req.user.username, true]
    );

    // Rotar: eliminar backups que superen MAX_BACKUPS
    const allBackups = await query('SELECT id FROM backups ORDER BY created_at DESC');
    const deleted = [];
    if (allBackups.rows.length > MAX_BACKUPS) {
      const toDelete = allBackups.rows.slice(MAX_BACKUPS);
      for (const old of toDelete) {
        const delRes = await query('DELETE FROM backups WHERE id = $1 RETURNING filename', [old.id]);
        if (delRes.rows[0]) deleted.push(delRes.rows[0].filename);
      }
    }

    // Log en movements
    try {
      await query(
        'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
        [null, 'backup_created', req.user.id, JSON.stringify({
          filename,
          sizeMB: (sizeBytes / 1024 / 1024).toFixed(2),
          deletedOldBackups: deleted,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        })]
      );
    } catch (_) { /* log no crítico */ }

    res.json({
      success: true,
      message: 'Backup creado exitosamente en la nube',
      data: {
        filename,
        sizeMB: (sizeBytes / 1024 / 1024).toFixed(2),
        createdAt: new Date().toISOString(),
        deletedOldBackups: deleted,
        storageType: 'supabase-cloud',
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

    // Buscar backup en Supabase
    const backupResult = await query(
      'SELECT data FROM backups WHERE filename = $1',
      [filename]
    );
    if (backupResult.rows.length === 0) throw new AppError('Backup no encontrado en la nube', 404);

    const backupData = backupResult.rows[0].data;

    // Compatibilidad hacia atrás
    if (backupData.tables) {
      if (!backupData.tables['global_samples'] && backupData.tables['samples']) {
        backupData.tables['global_samples'] = backupData.tables['samples'];
        delete backupData.tables['samples'];
      }
    }

    const GENERATED_COLUMNS = { shelves: ['total_capacity'] };

    const restoreOrder = [
      'users',
      'market_lines',
      'suppliers',
      'shelves',
      'shelf_suppliers',
      'global_samples',
      'dispensed_samples',
      'movements',
    ];

    const stats = { restored: {}, skipped: [], errors: [] };

    await client.query('BEGIN');

    for (const table of restoreOrder) {
      const rows = backupData.tables?.[table];
      if (!rows || rows.length === 0) {
        stats.skipped.push(table);
        continue;
      }

      const tableExists = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
        [table]
      );
      if (!tableExists.rows[0].exists) {
        stats.skipped.push(`${table} (no existe en BD)`);
        continue;
      }

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

    // Log de restauración
    try {
      await query(
        'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
        [null, 'backup_restored', req.user.id, JSON.stringify({
          filename,
          backupDate: backupData.generatedAt,
          stats,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        })]
      );
    } catch (_) { /* log no crítico */ }

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
    const result = await query('DELETE FROM backups WHERE filename = $1 RETURNING id', [filename]);

    if (result.rows.length === 0) throw new AppError('Backup no encontrado', 404);

    res.json({
      success: true,
      message: `Backup "${filename}" eliminado exitosamente`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/backup/status
 */
const getBackupStatus = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1'
    );
    const countResult = await query('SELECT COUNT(*) FROM backups');

    const now = new Date();
    // Leer config
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

    res.json({
      success: true,
      data: {
        totalBackups: parseInt(countResult.rows[0].count),
        maxBackups: MAX_BACKUPS,
        intervalDays: intervalDays,
        hour: hour,
        isDue,
        daysSinceLast,
        lastBackup: result.rows.length > 0 ? result.rows[0].created_at : null,
        storageType: 'supabase-cloud',
        schedulerInfo: `Backup automático cada ${intervalDays} días a las ${hour}:00 hora Bogotá`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Stub para compatibilidad con rutas que usaban OneDrive
const syncToOneDrive = async (req, res) => {
  res.json({
    success: false,
    message: 'La sincronización con OneDrive no está disponible en el entorno cloud. Los backups se guardan directamente en Supabase.',
  });
};

/**
 * Obtener la configuración actual de backups
 */
const getSettings = async (req, res, next) => {
  try {
    // Asegurar que la tabla existe
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const configRes = await query("SELECT value FROM settings WHERE key = 'backup_config'");
    const config = configRes.rows.length > 0 ? configRes.rows[0].value : { interval_days: 20, hour: 12 };
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

/**
 * Actualizar la configuración de backups
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

    // Asegurar que la tabla existe
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
 * Endpoint de Cron Local
 */
const runCronJob = async (req, res, next) => {
  try {
    // Leer config
    let intervalDays = 20;
    let hour = 12;
    try {
      const configRes = await query("SELECT value FROM settings WHERE key = 'backup_config'");
      if (configRes.rows.length > 0) {
        intervalDays = configRes.rows[0].value.interval_days || 20;
        hour = configRes.rows[0].value.hour || 12;
      }
    } catch (_) {}

    // 1. Validar hora (Se permite flexibilidad local)
    // El backup se ejecutará en la primera oportunidad una vez cumplido el intervalo de días.
    const now = new Date();
    const bogota = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const currentHour = bogota.getUTCHours();
    console.log(`[CRON] Verificando backup. Hora Bogotá: ${currentHour}, Intervalo: ${intervalDays} días`);

    // 2. Validar intervalo de días
    const result = await query('SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1');
    if (result.rows.length > 0) {
      const lastDate = new Date(result.rows[0].created_at);
      const daysSinceLast = (now - lastDate) / (1000 * 60 * 60 * 24);
      if (daysSinceLast < intervalDays) {
        return res.json({ success: true, message: `Aún no han pasado ${intervalDays} días desde el último backup.` });
      }
    }

    // Crear el backup
    const filename = generateBackupFilename();
    const fullData = await exportDatabaseToJSON();
    const jsonStr = JSON.stringify(fullData);
    const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');

    await query(
      'INSERT INTO backups (filename, size_bytes, data, created_by, manual) VALUES ($1, $2, $3::jsonb, $4, $5)',
      [filename, sizeBytes, jsonStr, 'local-cron', false]
    );

    // Rotar
    const allBackups = await query('SELECT id FROM backups ORDER BY created_at DESC');
    if (allBackups.rows.length > MAX_BACKUPS) {
      const toDelete = allBackups.rows.slice(MAX_BACKUPS);
      for (const old of toDelete) {
        await query('DELETE FROM backups WHERE id = $1', [old.id]);
      }
    }

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
};
