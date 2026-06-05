/**
 * Backup Scheduler - Handler TrackSamples
 * Verifica cada hora si debe ejecutar un backup automático.
 * Guarda en BD + Handler/backups/ + OneDrive/Handler_backups/
 */

const { query } = require('./database');
const { performBackup } = require('../modules/backup/controller');

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // cada hora

const getBogotaHour = () => {
  const now = new Date();
  const bogota = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return bogota.getUTCHours();
};

const shouldRunBackup = async () => {
  let intervalDays = 20;
  let backupHour   = 12;
  try {
    const configRes = await query("SELECT value FROM settings WHERE key = 'backup_config'");
    if (configRes.rows.length > 0) {
      intervalDays = configRes.rows[0].value.interval_days || 20;
      backupHour   = configRes.rows[0].value.hour || 12;
    }
  } catch (_) {}

  if (getBogotaHour() !== backupHour) return false;

  try {
    const result = await query('SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1');
    if (result.rows.length > 0) {
      const daysSinceLast = (Date.now() - new Date(result.rows[0].created_at)) / (1000 * 60 * 60 * 24);
      return daysSinceLast >= intervalDays;
    }
  } catch (_) {}

  return true; // nunca se ha hecho backup
};

const runSchedulerCheck = async () => {
  try {
    const shouldRun = await shouldRunBackup();
    if (!shouldRun) return;

    console.log('[SCHEDULER] ⏰ Iniciando backup automático...');
    const { filename, localResult, onedriveResult } = await performBackup('sistema-scheduler', false);

    console.log(`[SCHEDULER] ✅ Backup completado: ${filename}`);
    if (localResult.success)    console.log(`[SCHEDULER]    📁 Local:    ${localResult.path}`);
    if (onedriveResult.success) console.log(`[SCHEDULER]    ☁️  OneDrive: ${onedriveResult.path}`);
    if (!onedriveResult.success && onedriveResult.error !== 'OneDrive no detectado') {
      console.warn(`[SCHEDULER]    ⚠️  OneDrive no disponible: ${onedriveResult.error}`);
    }
  } catch (err) {
    console.error('[SCHEDULER] ❌ Error en backup automático:', err.message);
  }
};

const startBackupScheduler = () => {
  console.log('[SCHEDULER] Iniciando sistema de respaldos automáticos (revisión cada 1h)...');
  runSchedulerCheck();
  setInterval(runSchedulerCheck, CHECK_INTERVAL_MS);
};

module.exports = { startBackupScheduler, runSchedulerCheck };
