require('dotenv').config();
const { pool } = require('../src/services/database');

async function migrate() {
  console.log('Starting execution of database migrations...');

  try {
    // 1. Create suppliers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        market_lines TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created suppliers table');

    // 2. Modify global_samples: add supplier_id, new unit fields
    // Adding optional first, then will push data or alter types.
    await pool.query(`
      ALTER TABLE global_samples
      ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id),
      ADD COLUMN IF NOT EXISTS total_units INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS available_units INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS weight_per_unit_grams INTEGER DEFAULT 0;
    `);
    console.log('✅ Updated global_samples columns');

    // Due to existing 'provider' let's migrate any unique text providers to the suppliers table temporarily
    const distinctProviders = await pool.query(`SELECT DISTINCT provider FROM global_samples WHERE provider IS NOT NULL AND provider != ''`);
    for (const row of distinctProviders.rows) {
      if (row.provider) {
        // insert if not exists
        const check = await pool.query(`SELECT id FROM suppliers WHERE name = $1`, [row.provider]);
        let sId;
        if (check.rows.length === 0) {
          const insertSupp = await pool.query(`INSERT INTO suppliers (name) VALUES ($1) RETURNING id`, [row.provider]);
          sId = insertSupp.rows[0].id;
        } else {
          sId = check.rows[0].id;
        }
        await pool.query(`UPDATE global_samples SET supplier_id = $1 WHERE provider = $2`, [sId, row.provider]);
      }
    }
    console.log('✅ Migrated text providers to suppliers table');

    // 3. Drop obsolete columns from global_samples
    await pool.query(`
      ALTER TABLE global_samples 
      DROP COLUMN IF EXISTS provider,
      DROP COLUMN IF EXISTS current_weight_grams,
      DROP COLUMN IF EXISTS total_weight_grams;
    `);
    console.log('✅ Dropped obsolete columns from global_samples');

    // 4. Create child_samples table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS child_samples (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        qr_code VARCHAR(255) UNIQUE NOT NULL,
        global_sample_id UUID REFERENCES global_samples(id) ON DELETE CASCADE,
        shelf_id UUID REFERENCES shelves(id),
        status VARCHAR(50) DEFAULT 'available', -- 'available', 'dispatched', 'dispensed'
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created child_samples table');

    console.log('🎉 Migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
