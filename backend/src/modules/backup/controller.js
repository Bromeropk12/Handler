/**
 * Backup Controller - Handler TrackSamples
 * Sistema de respaldo automático de base de datos
 * Solo accesible para administradores
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const bcrypt = require('bcryptjs');
const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

// ─────────────────────────────────────────
//  CONFIGURACIÓN
// ─────────────────────────────────────────
const MAX_BACKUPS = 3;          // Máximo 3 backups → ~60 días
const BACKUP_INTERVAL_DAYS = 20;
const BACKUP_HOUR_BOGOTA = 12;  // 12pm hora Bogotá (UTC-5)

// Directorio raíz del programa (Handler/)
const PROJECT_ROOT = path.resolve(__dirname, '../../../../../');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups');

// Asegurar que el directorio de backups existe
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

// ─────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────

/**
 * Genera nombre de archivo de backup con timestamp Bogotá
 */
const generateBackupFilename = () => {
  const now = new Date();
  // Convertir a hora Bogotá (UTC-5)
  const bogota = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const ts = bogota.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `backup_handler_${ts}.json`;
};

/**
 * Listar backups existentes ordenados por fecha (más reciente primero)
 */
const listBackupFiles = () => {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_handler_') && f.endsWith('.json'))
    .map(f => {
      const full = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(full);
      return {
        filename: f,
        fullPath: full,
        sizeBytes: stat.size,
        createdAt: stat.mtime,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt); // más reciente primero
  return files;
};

/**
 * Detectar ruta de OneDrive en Windows 11
 */
const detectOneDrivePath = () => {
  // Intentar desde variables de entorno primero
  const env = process.env.OneDrive || process.env.OneDriveConsumer || process.env.OneDriveCommercial;
  if (env && fs.existsSync(env)) return env;

  // Rutas típicas de Windows 11
  const username = os.userInfo().username;
  const candidates = [
    path.join('C:\\Users', username, 'OneDrive'),
    path.join('C:\\Users', username, 'OneDrive - Personal'),
    path.join('C:\\Users', username, 'OneDrive - Handler'),
    path.join('C:\\Users', username, 'OneDrive for Business'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
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
    'shelf_positions',
    'shelf_occupancy',
    'suppliers',
    'market_lines',
    'movements',
    'dispatches',
    'dispatch_items',
    'shelf_suppliers',
    'alerts',
  ];

  const data = {
    version: '1.0',
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
      const result = await query(`SELECT * FROM ${table} ORDER BY id`);
      data.tables[table] = result.rows;
    } catch (err) {
      // Tabla puede no existir en todas las versiones
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
 * Listar todos los backups disponibles
 */
const listBackups = async (req, res, next) => {
  try {
    const files = listBackupFiles();
    const oneDrivePath = detectOneDrivePath();
    const oneDriveBackupDir = oneDrivePath ? path.join(oneDrivePath, 'Handler_Backups') : null;

    // Calcular próximo backup
    const now = new Date();
    const lastBackup = files.length > 0 ? files[0].createdAt : null;
    let nextBackup = null;

    if (lastBackup) {
      const next = new Date(lastBackup.getTime() + BACKUP_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
      // Ajustar a las 12pm Bogotá
      next.setUTCHours(BACKUP_HOUR_BOGOTA + 5, 0, 0, 0); // 17 UTC = 12 Bogotá
      nextBackup = next.toISOString();
    }

    const backupList = files.map((f, i) => ({
      id: i + 1,
      filename: f.filename,
      sizeMB: (f.sizeBytes / 1024 / 1024).toFixed(2),
      createdAt: f.createdAt.toISOString(),
      isOldest: i === files.length - 1,
    }));

    res.json({
      success: true,
      data: {
        backups: backupList,
        backupDir: BACKUP_DIR,
        maxBackups: MAX_BACKUPS,
        intervalDays: BACKUP_INTERVAL_DAYS,
        nextBackupScheduled: nextBackup,
        oneDriveAvailable: !!oneDrivePath,
        oneDrivePath: oneDriveBackupDir,
        totalBackups: files.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/backup/create
 * Crear backup manualmente (solo admin)
 */
const createBackup = async (req, res, next) => {
  try {
    ensureBackupDir();

    const filename = generateBackupFilename();
    const filePath = path.join(BACKUP_DIR, filename);

    // Exportar BD
    const data = await exportDatabaseToJSON();
    data.createdBy = req.user.username;
    data.manual = true;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    const stat = fs.statSync(filePath);

    // ── Rotar: eliminar backups que superen MAX_BACKUPS ──
    const allFiles = listBackupFiles();
    const deleted = [];
    if (allFiles.length > MAX_BACKUPS) {
      const toDelete = allFiles.slice(MAX_BACKUPS); // los más antiguos
      for (const old of toDelete) {
        fs.unlinkSync(old.fullPath);
        deleted.push(old.filename);
      }
    }

    // Log en movements
    try {
      await query(
        'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
        [null, 'backup_created', req.user.id, JSON.stringify({
          filename,
          sizeMB: (stat.size / 1024 / 1024).toFixed(2),
          deletedOldBackups: deleted,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        })]
      );
    } catch (_) { /* log no crítico */ }

    res.json({
      success: true,
      message: 'Backup creado exitosamente',
      data: {
        filename,
        sizeMB: (stat.size / 1024 / 1024).toFixed(2),
        createdAt: stat.mtime.toISOString(),
        deletedOldBackups: deleted,
        backupDir: BACKUP_DIR,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/backup/restore
 * Restaurar backup (requiere contraseña del admin)
 */
const restoreBackup = async (req, res, next) => {
  const { pool } = require('../../services/database');
  const client = await pool.connect();

  try {
    const { filename, password } = req.body;

    if (!filename || !password) {
      throw new AppError('Nombre de archivo y contraseña son requeridos', 400);
    }

    // Verificar contraseña del admin (fuera de la transacción)
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    if (userResult.rows.length === 0) {
      throw new AppError('Usuario no encontrado', 404);
    }
    const isValid = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!isValid) {
      throw new AppError('Contraseña incorrecta. La restauración fue cancelada por seguridad.', 401);
    }

    // Verificar que el archivo existe
    const filePath = path.join(BACKUP_DIR, path.basename(filename));
    if (!fs.existsSync(filePath)) {
      throw new AppError('Archivo de backup no encontrado', 404);
    }

    // Leer y parsear backup
    const raw = fs.readFileSync(filePath, 'utf8');
    let backupData;
    try {
      backupData = JSON.parse(raw);
    } catch {
      throw new AppError('El archivo de backup está corrupto o no es válido', 400);
    }

    // ── Compatibilidad hacia atrás ──
    // Backups antiguos guardaban 'samples' en vez de 'global_samples'
    if (backupData.tables) {
      if (!backupData.tables['global_samples'] && backupData.tables['samples']) {
        backupData.tables['global_samples'] = backupData.tables['samples'];
        delete backupData.tables['samples'];
      }
    }

    // Columnas auto-generadas que PostgreSQL calcula solo (no se pueden insertar)
    const GENERATED_COLUMNS = {
      shelves: ['total_capacity'],
    };

    // Orden de restauración respetando estrictamente foreign keys
    const restoreOrder = [
      'users',
      'market_lines',
      'suppliers',
      'shelves',           // shelves depends on market_lines
      'shelf_suppliers',   // depends on shelves, suppliers
      'global_samples',    // depends on market_lines, suppliers, shelves
      'dispensed_samples', // depends on global_samples, shelves
      'shelf_positions',
      'shelf_occupancy',
      'dispatches',
      'dispatch_items',
      'movements',         // depends on users
      'alerts',
    ];

    const stats = { restored: {}, skipped: [], errors: [] };

    // ── Iniciar transacción atómica ──
    await client.query('BEGIN');

    for (const table of restoreOrder) {
      const rows = backupData.tables?.[table];
      if (!rows || rows.length === 0) {
        stats.skipped.push(table);
        continue;
      }

      // Verificar si la tabla existe en la BD actual antes de intentar truncar
      const tableExists = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
        [table]
      );
      
      if (!tableExists.rows[0].exists) {
        stats.skipped.push(`${table} (no existe en BD)`);
        continue;
      }

      // Truncar tabla (dentro de la transacción)
      await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

      let insertedCount = 0;
      for (const rawRow of rows) {
        // Clonar para no mutar el original
        const row = { ...rawRow };

        // Eliminar columnas auto-generadas
        const generatedCols = GENERATED_COLUMNS[table] || [];
        for (const col of generatedCols) {
          delete row[col];
        }

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

    // Confirmar transacción
    await client.query('COMMIT');

    // Log de restauración (fuera de la transacción principal)
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
    // Rollback total si algo falla
    try { await client.query('ROLLBACK'); } catch (_) {}
    next(error);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/backup/:filename
 * Eliminar un backup específico
 */
const deleteBackup = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, path.basename(filename));

    if (!fs.existsSync(filePath)) {
      throw new AppError('Archivo de backup no encontrado', 404);
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `Backup "${filename}" eliminado exitosamente`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/backup/sync-onedrive
 * Copiar todos los backups a la carpeta de OneDrive
 */
const syncToOneDrive = async (req, res, next) => {
  try {
    const oneDrivePath = detectOneDrivePath();

    if (!oneDrivePath) {
      throw new AppError(
        'OneDrive no encontrado en este equipo. Asegúrese de que OneDrive esté instalado y sincronizado.',
        404
      );
    }

    const oneDriveBackupDir = path.join(oneDrivePath, 'Handler_Backups');
    if (!fs.existsSync(oneDriveBackupDir)) {
      fs.mkdirSync(oneDriveBackupDir, { recursive: true });
    }

    const files = listBackupFiles();
    const copied = [];

    for (const f of files) {
      const dest = path.join(oneDriveBackupDir, f.filename);
      fs.copyFileSync(f.fullPath, dest);
      copied.push(f.filename);
    }

    res.json({
      success: true,
      message: `${copied.length} backup(s) sincronizados con OneDrive`,
      data: {
        oneDrivePath: oneDriveBackupDir,
        copiedFiles: copied,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/backup/status
 * Estado del sistema de backups y configuración del scheduler
 */
const getBackupStatus = async (req, res, next) => {
  try {
    const files = listBackupFiles();
    const oneDrivePath = detectOneDrivePath();
    const now = new Date();

    let daysSinceLast = null;
    let isDue = true;

    if (files.length > 0) {
      const ms = now.getTime() - files[0].createdAt.getTime();
      daysSinceLast = Math.floor(ms / (1000 * 60 * 60 * 24));
      isDue = daysSinceLast >= BACKUP_INTERVAL_DAYS;
    }

    res.json({
      success: true,
      data: {
        totalBackups: files.length,
        maxBackups: MAX_BACKUPS,
        intervalDays: BACKUP_INTERVAL_DAYS,
        isDue,
        daysSinceLast,
        lastBackup: files.length > 0 ? files[0].createdAt.toISOString() : null,
        backupDir: BACKUP_DIR,
        oneDriveAvailable: !!oneDrivePath,
        oneDrivePath,
        schedulerInfo: `Backup automático cada ${BACKUP_INTERVAL_DAYS} días a las 12:00pm hora Bogotá`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
//  FUNCIÓN INTERNA: Crear backup automático
//  (llamada por el scheduler)
// ─────────────────────────────────────────
const createAutomaticBackup = async () => {
  try {
    ensureBackupDir();
    const filename = generateBackupFilename();
    const filePath = path.join(BACKUP_DIR, filename);

    const data = await exportDatabaseToJSON();
    data.manual = false;
    data.createdBy = 'system-scheduler';

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    // Rotar backups
    const allFiles = listBackupFiles();
    if (allFiles.length > MAX_BACKUPS) {
      const toDelete = allFiles.slice(MAX_BACKUPS);
      for (const old of toDelete) {
        fs.unlinkSync(old.fullPath);
        console.log(`[BACKUP] Backup antiguo eliminado: ${old.filename}`);
      }
    }

    console.log(`[BACKUP] Backup automático creado: ${filename}`);
    return { success: true, filename };
  } catch (err) {
    console.error('[BACKUP] Error en backup automático:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  listBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  syncToOneDrive,
  getBackupStatus,
  createAutomaticBackup,
  listBackupFiles,
  BACKUP_INTERVAL_DAYS,
  BACKUP_HOUR_BOGOTA,
};
