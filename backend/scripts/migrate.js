require('dotenv').config();
const { pool } = require('../src/services/database');
const fs = require('fs');
const path = require('path');

async function migrate() {
  console.log('🔄 Iniciando motor de migraciones dinámico...');

  try {
    // 1. Crear tabla de control de migraciones si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla schema_migrations verificada');

    // 2. Obtener migraciones ya ejecutadas
    const executedResult = await pool.query('SELECT name FROM schema_migrations');
    const executedMigrations = new Set(executedResult.rows.map(r => r.name));

    // 3. Leer archivos de migración
    const scriptsDir = path.join(__dirname, '../../database/scripts');
    if (!fs.existsSync(scriptsDir)) {
      console.warn('⚠️ [MIGRACIONES] Directorio de scripts no encontrado, omitiendo.');
      return;
    }
    const files = fs.readdirSync(scriptsDir);

    // Filtrar solo los que empiecen por "migration-" y terminen en ".sql", y ordenar
    const migrationFiles = files
      .filter(f => f.startsWith('migration-') && f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('ℹ️  No se encontraron archivos de migración.');
      return;
    }

    // 4. Ejecutar las migraciones pendientes
    let appliedCount = 0;
    for (const file of migrationFiles) {
      if (executedMigrations.has(file)) {
        console.log(`⏩ Saltando ${file} (ya ejecutada)`);
        continue;
      }

      console.log(`\n⚙️  Ejecutando migración: ${file}...`);
      const filePath = path.join(scriptsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Iniciar transacción explícita
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Ejecutar los comandos del script
        await client.query(sql);
        
        // Registrar la migración como ejecutada
        await client.query(
          'INSERT INTO schema_migrations (name) VALUES ($1)',
          [file]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Migración ${file} completada con éxito.`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Error ejecutando migración ${file}:`, err.message);
        throw err; // Detener el proceso si una falla
      } finally {
        client.release();
      }
    }

    if (appliedCount === 0) {
      console.log('\n✅ La base de datos ya está al día. No hay migraciones nuevas.');
    } else {
      console.log(`\n🎉 Se aplicaron ${appliedCount} nuevas migraciones exitosamente.`);
    }

  } catch (err) {
    console.error('❌ Proceso de migración fallido (FATAL):', err);
    try { await pool.end(); } catch (_) {}
    process.exit(1);
  } finally {
    try { await pool.end(); } catch (_) {}
  }
}

migrate();
