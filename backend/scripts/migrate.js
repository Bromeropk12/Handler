require('dotenv').config();
const { pool } = require('../src/services/database');

async function migrate() {
  console.log('Starting execution of database migrations...');

  try {
    // 1. Create suppliers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        market_lines TEXT[],
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created suppliers table');

    // 2. Modify global_samples: add supplier_id, new unit fields
    await pool.query(`
      ALTER TABLE global_samples
      ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id),
      ADD COLUMN IF NOT EXISTS total_units INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS available_units INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS weight_per_unit_grams DECIMAL(10,2);
    `);
    console.log('✅ Updated global_samples columns');

    // 3. Migrate text providers to suppliers table
    const distinctProviders = await pool.query(`SELECT DISTINCT provider FROM global_samples WHERE provider IS NOT NULL AND provider != ''`);
    for (const row of distinctProviders.rows) {
      if (row.provider) {
        const check = await pool.query(`SELECT id FROM suppliers WHERE name = $1`, [row.provider]);
        let sId;
        if (check.rows.length === 0) {
          const insertSupp = await pool.query(`INSERT INTO suppliers (name) VALUES ($1) RETURNING id`, [row.provider]);
          sId = insertSupp.rows[0].id;
        } else {
          sId = check.rows[0].id;
        }
        await pool.query(`UPDATE global_samples SET supplier_id = $1 WHERE provider = $2 AND supplier_id IS NULL`, [sId, row.provider]);
      }
    }
    console.log('✅ Migrated text providers to suppliers table');

    // 4. Add position_z to dispensed_samples if not exists
    await pool.query(`
      ALTER TABLE dispensed_samples
      ADD COLUMN IF NOT EXISTS position_z INTEGER DEFAULT 0;
    `);
    console.log('✅ Added position_z to dispensed_samples');

    // 5. Insert initial suppliers if not exist
    const initialSuppliers = [
      ['BASF', ['Cosmética', 'Industrial', 'Farmacéutica']],
      ['JRS', ['Cosmética']],
      ['THOR', ['Cosmética', 'Industrial']],
      ['JRF', ['Farmacéutica']],
      ['SUDEEP', ['Farmacéutica']],
      ['GIVAUDAN', ['Farmacéutica']],
      ['MEGGLE', ['Farmacéutica']]
    ];

    for (const [name, marketLines] of initialSuppliers) {
      const check = await pool.query(`SELECT id FROM suppliers WHERE name = $1`, [name]);
      if (check.rows.length === 0) {
        await pool.query(`INSERT INTO suppliers (name, market_lines) VALUES ($1, $2)`, [name, marketLines]);
        console.log(`  ✅ Inserted supplier: ${name}`);
      }
    }

    // 6. Add password_reset to action_type enum if not exists
    try {
      await pool.query(`ALTER TYPE action_type ADD VALUE 'password_reset'`);
      console.log('✅ Added password_reset to action_type');
    } catch (e) {
      // Value may already exist
      console.log('ℹ️  password_reset already exists in action_type');
    }

    // 7. Create indexes for performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_global_samples_supplier ON global_samples(supplier_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_dispensed_samples_position_3d ON dispensed_samples(shelf_id, position_x, position_y, position_z)`);
    console.log('✅ Created performance indexes');

    console.log('🎉 Migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();
