const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'handler_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Normaliza texto: elimina tildes/diacríticos y convierte a mayúsculas
// Ej: "Cosmética" → "COSMETICA", "Farmacéutica" → "FARMACEUTICA"
const normalize = (str) => str
  .toUpperCase()
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

async function run() {
  try {
    const csvPath = path.resolve(__dirname, '../../archivos/insercion_de_Muetras.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split(/\r?\n/).map(l => l.trim()).filter(l => l);

    const pictoMap = {
      'GHS01': 'Explosivo',
      'GHS02': 'Inflamable',
      'GHS03': 'Comburente',
      'GHS04': 'Gas Bajo Presión',
      'GHS05': 'Corrosivo',
      'GHS06': 'Toxicidad Aguda',
      'GHS07': 'Irritante',
      'GHS08': 'Toxicidad Crónica',
      'GHS09': 'Tóxico para Medio Ambiente'
    };

    const suppliersRes = await pool.query('SELECT id, name FROM suppliers');
    const suppliersMap = {};
    suppliersRes.rows.forEach(r => suppliersMap[normalize(r.name)] = r.id);

    const linesRes = await pool.query('SELECT id, name FROM market_lines');
    const linesMap = {};
    linesRes.rows.forEach(r => linesMap[normalize(r.name)] = r.id);

    console.log(`Conectado a la BD. Proveedores en BD: ${Object.keys(suppliersMap).length}, Lineas en BD: ${Object.keys(linesMap).length}.`);

    // Limpiar muestras para no duplicar si se ejecuta varias veces
    await pool.query('DELETE FROM global_samples;');
    console.log('Tabla global_samples limpiada exitosamente para evitar duplicados.');

    let inserted = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(';');
      if (row.length < 18) continue;

      const name = row[0].trim();
      const lot = row[1].trim();
      const providerStr = row[2].trim();
      const dangerClassStr = row[3].trim();
      let signalWordStr = row[4].trim();
      
      const pictograms = [];
      if (row[5].trim() === 'Si') pictograms.push('Explosivo');
      if (row[6].trim() === 'Si') pictograms.push('Inflamable');
      if (row[7].trim() === 'Si') pictograms.push('Comburente');
      if (row[8].trim() === 'Si') pictograms.push('Gas Bajo Presión');
      if (row[9].trim() === 'Si') pictograms.push('Corrosivo');
      if (row[10].trim() === 'Si') pictograms.push('Toxicidad Aguda');
      if (row[11].trim() === 'Si') pictograms.push('Irritante');
      if (row[12].trim() === 'Si') pictograms.push('Toxicidad Crónica');
      if (row[13].trim() === 'Si') pictograms.push('Tóxico para Medio Ambiente');

      const weightGrams = parseFloat(row[14].replace(',', '.'));
      
      // Parse Dates DD/MM/YYYY
      const partsM = row[15].trim().split('/');
      const manufacture_date = `${partsM[2]}-${partsM[1]}-${partsM[0]}`;

      const partsE = row[16].trim().split('/');
      const expiration_date = `${partsE[2]}-${partsE[1]}-${partsE[0]}`;

      const lineStr = row[17].trim();

      let supplier_id = suppliersMap[normalize(providerStr)];
      if (!supplier_id) {
        const insSup = await pool.query('INSERT INTO suppliers (name) VALUES ($1) RETURNING id', [providerStr]);
        supplier_id = insSup.rows[0].id;
        suppliersMap[normalize(providerStr)] = supplier_id;
        console.log(`Proveedor creado: ${providerStr}`);
      }

      let market_line_id = linesMap[normalize(lineStr)];
      if (!market_line_id) {
        const insLine = await pool.query('INSERT INTO market_lines (name) VALUES ($1) RETURNING id', [lineStr]);
        market_line_id = insLine.rows[0].id;
        linesMap[normalize(lineStr)] = market_line_id;
        console.log(`Línea de mercado creada: ${lineStr}`);
      }

      if (signalWordStr === 'INERTE (no requiere)' || signalWordStr === 'INERTE (no requiere)') signalWordStr = 'ATENCION';
      if (!['PELIGRO', 'ATENCION'].includes(signalWordStr)) signalWordStr = 'ATENCION';

      let danger_class = dangerClassStr;
      // Tratar "Tóxico" vs "Toxico"
      if (danger_class === 'Tóxico') danger_class = 'Toxico';
      if (!['Sin Riesgo', 'Inflamable', 'Corrosivo', 'Toxico', 'Comburente', 'Explosivo'].includes(danger_class)) {
        danger_class = 'Sin Riesgo';
      }

      try {
        await pool.query(`
          INSERT INTO global_samples (
            name, supplier_id, provider, lot, manufacture_date, expiration_date,
            ghs_danger_class, ghs_pictograms, signal_word, market_line_id,
            dimensions, total_units, available_units, total_weight_grams, dispensed_size
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, '1x1x1', 0, 0, $11, '1x1x1'
          )
        `, [
          name, supplier_id, providerStr, lot, manufacture_date, expiration_date,
          danger_class, pictograms, signalWordStr, market_line_id, weightGrams
        ]);
        inserted++;
      } catch (err) {
        console.error(`Row ${i} Error (Lot ${lot}): ${err.message}`);
        errors++;
      }
    }

    console.log(`\nFinalizado. Insertados: ${inserted}, Errores: ${errors}`);
  } catch (e) {
    console.error('Error fatal:', e);
  } finally {
    pool.end();
  }
}

run();
