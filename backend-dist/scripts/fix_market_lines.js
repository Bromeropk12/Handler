const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  // IDs incorrectos (creados por el script por no hacer match exacto)
  const BAD_COSMETICA  = 'f1358c7e-e2ba-439b-b6a6-16ea42dbb6c7';
  const BAD_FARMA      = '99c374e3-57a8-4309-8cfc-b91f6dd69600';
  // IDs correctos (los que tienen anaqueles configurados)
  const GOOD_COSMETICA = '2ce669b8-e8d3-4216-926a-8728c821d8e7'; // "Cosmética"
  const GOOD_FARMA     = 'dfbe17f4-999f-4a16-a050-3794c900f2e1'; // "Farmacéutica"

  // 1. Reasignar muestras de duplicados a las líneas correctas
  const r1 = await pool.query(
    'UPDATE global_samples SET market_line_id = $1 WHERE market_line_id = $2',
    [GOOD_COSMETICA, BAD_COSMETICA]
  );
  console.log(`Muestras reasignadas a Cosmética: ${r1.rowCount}`);

  const r2 = await pool.query(
    'UPDATE global_samples SET market_line_id = $1 WHERE market_line_id = $2',
    [GOOD_FARMA, BAD_FARMA]
  );
  console.log(`Muestras reasignadas a Farmacéutica: ${r2.rowCount}`);

  // 2. Eliminar las líneas duplicadas vacías
  const d1 = await pool.query('DELETE FROM market_lines WHERE id = $1', [BAD_COSMETICA]);
  console.log(`Línea "COSMETICA" (duplicado) eliminada: ${d1.rowCount}`);

  const d2 = await pool.query('DELETE FROM market_lines WHERE id = $1', [BAD_FARMA]);
  console.log(`Línea "FARMA" (duplicado) eliminada: ${d2.rowCount}`);

  // 3. Verificar estado final
  const counts = await pool.query(`
    SELECT ml.name, COUNT(gs.id) as muestras
    FROM market_lines ml
    LEFT JOIN global_samples gs ON gs.market_line_id = ml.id
    GROUP BY ml.id, ml.name
    ORDER BY ml.name
  `);
  console.log('\n✅ Estado final:');
  counts.rows.forEach(r => console.log(`  ${r.name}: ${r.muestras} muestras`));
}

fix()
  .then(() => { console.log('\nListo.'); pool.end(); })
  .catch(e => { console.error('ERROR:', e.message); pool.end(); });
