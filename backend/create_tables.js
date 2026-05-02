const { query, close } = require('./src/services/database');

async function run() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS backups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        size_bytes BIGINT NOT NULL,
        is_automatic BOOLEAN DEFAULT false,
        data JSONB NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Default backup settings
      INSERT INTO settings (key, value)
      VALUES ('backup_config', '{"interval_days": 20, "hour": 12}'::jsonb)
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('Tables created successfully');
  } catch (err) {
    console.error(err);
  } finally {
    await close();
  }
}

run();
