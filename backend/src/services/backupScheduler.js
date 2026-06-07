/**
 * Backup Scheduler - Handler TrackSamples
 * Verifica cada hora si debe ejecutar un backup automático.
 * Guarda en BD + Handler/backups/ + OneDrive/Handler_backups/
 *
 * BUGS CORREGIDOS:
 *  1. getBogotaHour() ahora calcula correctamente UTC-5 usando Intl.
 *  2. La verificación de hora ahora tiene una ventana de ±1h para tolerar
 *     retrasos de arranque del servidor (si el servidor no estaba activo
 *     exactamente a la hora configurada, igual ejecuta el backup).
 *  3. Se agrega protección anti-doble-ejecución: si ya hubo un backup HOY
 *     (en la misma fecha bogotana), no se ejecuta de nuevo aunque se
 *     cumpla el intervalo de días.
 *  4. El setInterval usa unref() para no bloquear el cierre limpio del proceso.
 *  5. Log de diagnóstico mejorado para facilitar depuración futura.
 */

const { query } = require('./database');
const { performBackup } = require('../modules/backup/controller');

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // cada hora

/**
 * Devuelve la hora actual en la zona horaria de Bogotá (UTC-5) usando Intl.
 * Más robusto que restar manualmente 5h porque maneja horario de verano (DST).
 * Colombia NO tiene DST, pero esta forma es más explícita y portable.
 */
const getBogotaHour = () => {
  const now = new Date();
  const bogotaTime = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    hour12: false,
  }).format(now);
  // Intl puede devolver "24" en medianoche en algunos entornos → normalizar a 0
  const h = parseInt(bogotaTime, 10);
  return isNaN(h) ? 0 : h % 24;
};

/**
 * Devuelve la fecha actual en Bogotá como string 'YYYY-MM-DD'.
 * Usado para detectar si ya se ejecutó el backup hoy.
 */
const getBogotaDateString = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // 'en-CA' produce formato YYYY-MM-DD
};

/**
 * Evalúa si el scheduler debe ejecutar un backup ahora.
 *
 * Reglas:
 *  A. Si NUNCA se ha hecho un backup → ejecutar siempre (primera vez).
 *  B. Si el último backup fue hoy (fecha Bogotá) → NO ejecutar (ya se hizo hoy).
 *  C. Si han pasado >= intervalDays días desde el último backup:
 *       - Si la hora actual (Bogotá) está dentro de la ventana [backupHour, backupHour+1) → ejecutar.
 *       - Si ya PASÓ la hora programada en el día de hoy pero no se ejecutó → ejecutar igual
 *         (recuperación ante ausencia del servidor durante la hora programada).
 */
const shouldRunBackup = async () => {
  let intervalDays = 20;
  let backupHour   = 12;

  try {
    const configRes = await query("SELECT value FROM settings WHERE key = 'backup_config'");
    if (configRes.rows.length > 0) {
      intervalDays = Number(configRes.rows[0].value.interval_days) || 20;
      backupHour   = Number(configRes.rows[0].value.hour) ?? 12;
    }
  } catch (_) {}

  const currentHour        = getBogotaHour();
  const todayBogota        = getBogotaDateString();

  console.log(`[SCHEDULER] Verificación — Hora Bogotá: ${currentHour}:xx | Hora programada: ${backupHour}:00 | Intervalo: ${intervalDays} días`);

  // Verificar último backup
  let lastBackupDate = null;
  let daysSinceLast  = Infinity;

  try {
    const result = await query('SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1');
    if (result.rows.length > 0) {
      const lastBackupAt = new Date(result.rows[0].created_at);
      daysSinceLast = (Date.now() - lastBackupAt.getTime()) / (1000 * 60 * 60 * 24);

      // Fecha del último backup en Bogotá
      lastBackupDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(lastBackupAt);

      console.log(`[SCHEDULER] Último backup: ${lastBackupDate} | Días transcurridos: ${daysSinceLast.toFixed(2)}`);
    } else {
      console.log('[SCHEDULER] Sin backups previos — se ejecutará el primero.');
    }
  } catch (err) {
    console.warn('[SCHEDULER] No se pudo consultar el último backup:', err.message);
  }

  // Regla B: Si ya se hizo un backup hoy, no repetir
  if (lastBackupDate === todayBogota) {
    console.log('[SCHEDULER] Ya se realizó un backup hoy. Omitiendo.');
    return false;
  }

  // Regla A: Primera vez — ejecutar sin restricción de hora
  if (daysSinceLast === Infinity) {
    return true;
  }

  // Regla C: El intervalo de días se cumplió
  if (daysSinceLast >= intervalDays) {
    // Ventana de ejecución: desde la hora programada hasta las 23:59
    // Esto permite que el backup se ejecute aunque el servidor haya arrancado
    // después de la hora exacta configurada.
    if (currentHour >= backupHour) {
      console.log(`[SCHEDULER] ✅ Condición cumplida — ${daysSinceLast.toFixed(1)} días >= ${intervalDays} días y hora ${currentHour} >= ${backupHour}`);
      return true;
    } else {
      console.log(`[SCHEDULER] Intervalo cumplido pero hora ${currentHour} < ${backupHour} programada. Esperando...`);
      return false;
    }
  }

  console.log(`[SCHEDULER] Intervalo no cumplido: ${daysSinceLast.toFixed(1)} días < ${intervalDays} días requeridos.`);
  return false;
};

const runSchedulerCheck = async () => {
  try {
    const shouldRun = await shouldRunBackup();
    if (!shouldRun) return;

    console.log('[SCHEDULER] ⏰ Iniciando backup automático programado...');
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
  // Primera verificación al arrancar (con retardo de 30s para dar tiempo a que la BD esté lista)
  setTimeout(runSchedulerCheck, 30 * 1000);
  // Revisión periódica cada hora; unref() evita que el timer bloquee el cierre del proceso
  const timer = setInterval(runSchedulerCheck, CHECK_INTERVAL_MS);
  if (timer.unref) timer.unref();
};

module.exports = { startBackupScheduler, runSchedulerCheck, getBogotaHour, getBogotaDateString, shouldRunBackup };
