const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const testConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME_TEST || 'handler_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

async function initTestDatabase() {
  const pool = new Pool(testConfig);

  try {
    console.log('🗃️ Inicializando base de datos de pruebas...');

    // Leer el script SQL
    const sqlPath = path.join(__dirname, '../../database/scripts/init.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el script
    await pool.query(sqlScript);

    console.log('✅ Base de datos de pruebas inicializada exitosamente');

    // Insertar datos de prueba
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const hashedSecret = await bcrypt.hash('secret123', 10);

    await pool.query(`
      INSERT INTO users (id, username, password_hash, secret_password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING
    `, [
      '550e8400-e29b-41d4-a716-446655440010',
      'admin',
      hashedPassword,
      hashedSecret,
      'admin'
    ]);

    console.log('✅ Usuario de prueba insertado');

  } catch (error) {
    console.error('❌ Error inicializando base de datos de pruebas:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initTestDatabase();
}

module.exports = { initTestDatabase };