const { pool } = require('./database');
const fs = require('fs');
const path = require('path');

/**
 * Ejecuta de forma silenciosa y segura las migraciones de base de datos pendientes.
 */
async function runMigrationsSilent() {
  console.log('🔄 [MIGRACIONES] Comprobando actualizaciones de esquema...');

  // 1. Crear tabla de control de migraciones si no existe
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Obtener migraciones ya ejecutadas
  const executedResult = await pool.query('SELECT name FROM schema_migrations');
  const executedMigrations = new Set(executedResult.rows.map(r => r.name));

  // 3. Leer archivos de migración
  const scriptsDir = path.join(__dirname, '../../../database/scripts');
  if (!fs.existsSync(scriptsDir)) {
    console.log('ℹ️ [MIGRACIONES] Directorio de scripts no encontrado, omitiendo.');
    return;
  }

  const files = fs.readdirSync(scriptsDir);
  const migrationFiles = files
    .filter(f => f.startsWith('migration-') && f.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('✅ [MIGRACIONES] Base de datos al día. No hay migraciones pendientes.');
    return;
  }

  // 4. Ejecutar las migraciones pendientes
  let appliedCount = 0;
  for (const file of migrationFiles) {
    if (executedMigrations.has(file)) {
      continue;
    }

    console.log(`⚙️ [MIGRACIONES] Aplicando migración pendiente: ${file}...`);
    const filePath = path.join(scriptsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (name) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
      console.log(`✅ [MIGRACIONES] Migración aplicada exitosamente: ${file}`);
      appliedCount++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ [MIGRACIONES] Error aplicando migración ${file}:`, err.message);
      throw err; // Lanza error para que se registre en el boot log
    } finally {
      client.release();
    }
  }

  if (appliedCount > 0) {
    console.log(`🎉 [MIGRACIONES] Se aplicaron ${appliedCount} nuevas migraciones.`);
  } else {
    console.log('✅ [MIGRACIONES] Base de datos completamente al día.');
  }
}

module.exports = {
  runMigrationsSilent
};
