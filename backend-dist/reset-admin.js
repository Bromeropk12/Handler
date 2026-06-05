const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://handler_user:handler_password@localhost:5432/handler_track_samples'
});

async function resetAdminPassword() {
  const hash = '$2a$12$wBQCACRkkx/DwVUZtO6V7uAYp3mCuv4Cx5ytcbwDPWEBZ5dVuzwUO';
  
  // Verify the hash is correct
  const match = await bcrypt.compare('admin123', hash);
  console.log('Hash verified (should be true):', match);
  
  if (!match) {
    console.error('Hash mismatch! Aborting.');
    process.exit(1);
  }

  const result = await pool.query(
    `UPDATE users SET password_hash = $1, secret_password_hash = $1 WHERE username = 'admin' RETURNING username, role`,
    [hash]
  );
  
  console.log('Updated rows:', result.rows);
  await pool.end();
}

resetAdminPassword().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
