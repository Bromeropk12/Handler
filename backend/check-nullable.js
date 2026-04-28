const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ host: process.env.DB_HOST||'localhost', port: parseInt(process.env.DB_PORT)||5432, database: process.env.DB_NAME||'handler_track_samples', user: process.env.DB_USER||'handler_user', password: process.env.DB_PASSWORD });
pool.query("SELECT is_nullable FROM information_schema.columns WHERE table_name = 'movements' AND column_name = 'sample_id'").then(r => {
  console.log('nullable:', r.rows[0].is_nullable);
  pool.end();
}).catch(console.error);
