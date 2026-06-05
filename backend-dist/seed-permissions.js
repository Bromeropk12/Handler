require('dotenv').config();
const { Pool } = require('pg');
const { DEFAULT_PERMISSIONS } = require('./src/config/permissions');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'handler_track_samples',
  user: process.env.DB_USER || 'handler_user',
  password: process.env.DB_PASSWORD
});

async function seedPermissions() {
  const res = await pool.query('SELECT id, username, role, permissions FROM users');
  let updated = 0;
  for (const u of res.rows) {
    const isEmpty = !u.permissions || Object.keys(u.permissions).length === 0;
    if (isEmpty) {
      const perms = DEFAULT_PERMISSIONS(u.role);
      await pool.query('UPDATE users SET permissions = $1 WHERE id = $2', [JSON.stringify(perms), u.id]);
      console.log(`✅ Permisos asignados a: ${u.username} (${u.role})`);
      updated++;
    } else {
      console.log(`ℹ️  Ya tiene permisos: ${u.username} (${Object.keys(u.permissions).length} permisos)`);
    }
  }
  console.log(`\nFinalizado. ${updated} usuario(s) actualizado(s).`);
}

seedPermissions().catch(console.error).finally(() => pool.end());
