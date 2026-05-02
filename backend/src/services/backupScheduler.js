/**
 * Backup Scheduler - Handler TrackSamples
 * Ejecuta backups automáticos cada 20 días a las 12:00pm hora Bogotá (UTC-5)
 * 
 * Estrategia: Verificación cada hora. Si es el momento correcto Y han pasado
 * al menos BACKUP_INTERVAL_DAYS desde el último backup, se ejecuta.
 */

const path = require('path');
const fs = require('fs');

const {
  createAutomaticBackup,
  listBackupFiles,
  BACKUP_INTERVAL_DAYS,
  BACKUP_HOUR_BOGOTA,
} = require('../modules/backup/controller');

const SCHEDULER_STATE_FILE = path.resolve(__dirname, '../../backup_scheduler_state.json');
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Verificar cada hora

/**
 * Leer el estado del scheduler desde disco
 */
const readSchedulerState = () => {
  try {
    if (fs.existsSync(SCHEDULER_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(SCHEDULER_STATE_FILE, 'utf8'));
    }
  } catch (_) {}
  return { lastBackupTimestamp: null };
};

/**
 * Guardar el estado del scheduler
 */
const writeSchedulerState = (state) => {
  try {
    fs.writeFileSync(SCHEDULER_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[SCHEDULER] No se pudo guardar estado:', err.message);
  }
};

/**
 * Obtener hora actual en Bogotá (UTC-5)
 */
const getBogotaHour = () => {
  const now = new Date();
  const bogota = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  return bogota.getUTCHours();
};

/**
 * Verificar si debe ejecutarse el backup
 */
const shouldRunBackup = () => {
  const currentHour = getBogotaHour();

  // Solo ejecutar a las 12pm Bogotá
  if (currentHour !== BACKUP_HOUR_BOGOTA) return false;

  // Verificar días transcurridos desde el último backup
  const state = readSchedulerState();

  // También revisar archivos reales por si acaso
  const files = listBackupFiles();
  const lastTs = files.length > 0
    ? files[0].createdAt.getTime()
    : (state.lastBackupTimestamp ? new Date(state.lastBackupTimestamp).getTime() : null);

  if (!lastTs) return true; // Nunca se ha hecho backup

  const daysSinceLast = (Date.now() - lastTs) / (1000 * 60 * 60 * 24);
  return daysSinceLast >= BACKUP_INTERVAL_DAYS;
};

/**
 * Función principal del scheduler
 */
const runSchedulerCheck = async () => {
  if (!shouldRunBackup()) return;

  console.log('[SCHEDULER] ✅ Es momento del backup automático. Iniciando...');
  const result = await createAutomaticBackup();

  if (result.success) {
    writeSchedulerState({ lastBackupTimestamp: new Date().toISOString() });
    console.log(`[SCHEDULER] ✅ Backup automático completado: ${result.filename}`);
  } else {
    console.error(`[SCHEDULER] ❌ Error en backup automático: ${result.error}`);
  }
};

/**
 * Iniciar el scheduler de backups
 * (Desactivado en Vercel porque Serverless no soporta setInterval persistente)
 */
const startBackupScheduler = () => {
  console.log(`[SCHEDULER] Scheduler desactivado en entorno Vercel Serverless.`);
};

module.exports = { startBackupScheduler, runSchedulerCheck: async () => {} };
