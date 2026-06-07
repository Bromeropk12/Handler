/**
 * Test rápido del Backup Scheduler - Handler TrackSamples
 * Ejecutar desde: Handler/backend/
 *   node test-scheduler.js
 */

// ─── Cargar variables de entorno ───────────────────────────────────────────
const path = require('path');
const fs = require('fs');

const prodEnvPath = path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'HandlerTrackSamples', '.env');
if (fs.existsSync(prodEnvPath)) {
  require('dotenv').config({ path: prodEnvPath });
  console.log(`✅ .env cargado desde producción: ${prodEnvPath}`);
} else {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  console.log('✅ .env cargado desde directorio local');
}

// ─── Prueba 1: getBogotaHour ───────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════');
console.log('PRUEBA 1: Cálculo de hora Bogotá');
console.log('══════════════════════════════════════════════');

const getBogotaHour = () => {
  const now = new Date();
  const bogotaTime = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    hour12: false,
  }).format(now);
  const h = parseInt(bogotaTime, 10);
  return isNaN(h) ? 0 : h % 24;
};

const getBogotaDateString = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

const horaActual = getBogotaHour();
const fechaActual = getBogotaDateString();
const utcHora = new Date().getUTCHours();

console.log(`  Hora UTC actual:          ${utcHora}:${String(new Date().getUTCMinutes()).padStart(2,'0')}`);
console.log(`  Hora Bogotá (nueva fn):   ${horaActual}:${String(new Date().getMinutes()).padStart(2,'0')}`);
console.log(`  Fecha Bogotá:             ${fechaActual}`);

const expectedBogota = (utcHora - 5 + 24) % 24;
const ok1 = horaActual === expectedBogota;
console.log(`  Verificación (UTC-5=${expectedBogota}): ${ok1 ? '✅ CORRECTO' : '❌ ERROR'}`);

// ─── Prueba 2: Lógica de ventana de tiempo ─────────────────────────────────
console.log('\n══════════════════════════════════════════════');
console.log('PRUEBA 2: Ventana de ejecución');
console.log('══════════════════════════════════════════════');

const testCases = [
  // [descripción, intervalDays, backupHour, daysSinceLast, lastDateIsTodayBogota, esperado]
  ['Primera vez (sin backups)',              20, 12, Infinity, false, true],
  ['Intervalo OK, hora OK, no hoy',          1, 10, 1.5,      false, true],
  ['Intervalo OK, hora ya pasó, recuperar', 20, 10, 25,       false, true],  // servidor arrancó tarde
  ['Intervalo OK, hora futura, esperar',    20, 23, 25,       false, false], // son las horaActual < 23
  ['Intervalo NO cumplido',                 20, 12, 10,       false, false],
  ['Ya se hizo backup hoy',                  1, 12, 1,        true,  false],
];

let passed = 0;
for (const [desc, intervalDays, backupHour, daysSinceLast, lastDateIsToday, expected] of testCases) {
  const lastBackupDate = lastDateIsToday ? fechaActual : '2000-01-01';
  
  // Simular shouldRunBackup sin BD
  let result;
  if (lastBackupDate === fechaActual) {
    result = false; // Regla B
  } else if (daysSinceLast === Infinity) {
    result = true;  // Regla A
  } else if (daysSinceLast >= intervalDays) {
    result = horaActual >= backupHour; // Regla C
  } else {
    result = false;
  }

  const ok = result === expected;
  if (ok) passed++;
  console.log(`  ${ok ? '✅' : '❌'} ${desc}`);
  if (!ok) console.log(`     → Esperado: ${expected}, Obtenido: ${result} (horaActual=${horaActual}, backupHour=${backupHour})`);
}
console.log(`\n  Resultado: ${passed}/${testCases.length} pruebas pasaron`);

// ─── Prueba 3: Conexión real a BD y configuración ──────────────────────────
console.log('\n══════════════════════════════════════════════');
console.log('PRUEBA 3: Conexión a BD y configuración guardada');
console.log('══════════════════════════════════════════════');

async function testDatabase() {
  try {
    const { query } = require('./src/services/database');
    
    // Verificar tabla settings
    const configRes = await query("SELECT value FROM settings WHERE key = 'backup_config'");
    if (configRes.rows.length > 0) {
      const config = configRes.rows[0].value;
      console.log(`  ✅ Configuración en BD: interval_days=${config.interval_days}, hour=${config.hour}`);
    } else {
      console.log('  ⚠️  No hay configuración en BD (se usarán defaults: 20 días, hora 12)');
    }

    // Verificar último backup
    const lastRes = await query('SELECT filename, created_at FROM backups ORDER BY created_at DESC LIMIT 1');
    if (lastRes.rows.length > 0) {
      const last = lastRes.rows[0];
      const daysSince = (Date.now() - new Date(last.created_at).getTime()) / (1000 * 60 * 60 * 24);
      console.log(`  ✅ Último backup: ${last.filename}`);
      console.log(`     Creado: ${new Date(last.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
      console.log(`     Hace: ${daysSince.toFixed(2)} días`);
    } else {
      console.log('  ⚠️  No hay backups en la BD (se ejecutará el primero al reiniciar)');
    }

    // ─── Prueba 4: Ejecutar el scheduler real ──────────────────────────────
    console.log('\n══════════════════════════════════════════════');
    console.log('PRUEBA 4: Ejecutar shouldRunBackup() real');
    console.log('══════════════════════════════════════════════');
    
    const { shouldRunBackup } = require('./src/services/backupScheduler');
    const should = await shouldRunBackup();
    console.log(`  Resultado shouldRunBackup(): ${should ? '▶️  SÍ ejecutaría backup' : '⏸️  NO ejecutaría (aún no es necesario)'}`);

    process.exit(0);
  } catch (err) {
    console.error(`  ❌ Error al conectar a BD: ${err.message}`);
    console.log('  (Esto es normal si el servidor no está corriendo)');
    process.exit(1);
  }
}

testDatabase();
