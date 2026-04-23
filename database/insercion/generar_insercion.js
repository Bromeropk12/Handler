const fs = require('fs');
const path = require('path');

// Mapeo de proveedores (nombre en CSV → supplier_id)
const supplierMap = {
    'THOR': 'e1d6bb4d-2536-4910-b871-9bade96dcbc5',
    'BASF': '9a14bfca-1de1-44ad-b533-68f55263e69c',
    'JRS': '286dbf32-27a2-48be-ad2f-6ef5b4a17054',
    'SUDEEP': 'f045ade0-c48c-4a34-b231-06e09a0c80ac',
    'MEGGLE': '930a2b97-21f0-43a3-8b83-5a52f04ccfb3',
    'GIVAUDAN INTERNATIONAL': 'bcef8047-bc1f-4108-a9e8-c13ddeaf4160'
    // K+S y ESCO no están en la BD, se omitirán
};

// Mapeo de líneas de mercado (nombre en CSV → market_line_id)
const marketLineMap = {
    'INDUSTRIAL': 'c65f41cd-96ed-445d-86f7-7a5bed353cf8',
    'COSMETICA': '3898311d-0228-48e8-a730-45a8d7adaed4',
    'FARMA': '264dfe84-c672-4da6-9e85-5e172f5c4140' // Farmacéutica
};

// Mapeo de signal_word
const signalWordMap = {
    'PELIGRO': 'PELIGRO',
    'ATENCIÓN': 'ATENCION',
    'INERTE (no requiere)': 'ATENCION'
};

// Función para convertir fecha de DD/MM/YYYY a YYYY-MM-DD
function convertDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Generar UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Extraer pictogramas basado en columnas Si/No del CSV
function extractPictograms(row) {
    const pictogramMap = {
        'Explosivo': 'Explosivo',
        'Inflamable': 'Inflamable',
        'Comburente': 'Comburente',
        'Gas Bajo Presión': 'Gas Bajo Presión',
        'Corrosivo': 'Corrosivo',
        'Toxicidad Aguda': 'Toxicidad Aguda',
        'Irritante': 'Irritante',
        'Toxicidad Crónica': 'Toxicidad Crónica',
        'Tóxico para Medio Ambiente': 'Tóxico para Medio Ambiente'
    };

    const pictograms = [];
    for (const [csvColumn, pictogramName] of Object.entries(pictogramMap)) {
        if (row[csvColumn] && row[csvColumn].toLowerCase() === 'si') {
            pictograms.push(pictogramName);
        }
    }
    return pictograms;
}

// Leer CSV
const csvPath = path.join(__dirname, 'insercion_de_Muetras.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Dividir en líneas y procesar
const lines = csvContent.split('\n').filter(line => line.trim() !== '');
const headers = lines[0].split(';');

// Generar SQL
let sql = '-- Script de inserción de muestras químicas con pictogramas GHS\n';
sql += '-- Generado automáticamente - Fecha: ' + new Date().toISOString() + '\n';
sql += '-- Total de registros en CSV: ' + (lines.length - 1) + '\n';
sql += '-- Los pictogramas se generan automáticamente desde columnas Si/No\n\n';
sql += 'BEGIN;\n\n';

let errorCount = 0;
let successCount = 0;
let skippedCount = 0;

for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');

    // Mapear columnas
    const row = {};
    headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
    });

    // Validar datos requeridos
    if (!row['Nombre del Producto'] || !row['Lote'] || !row['Proveedor'] ||
        !row['Clases de Peligro SGA PRINCIPAL'] || !row['Peso Total del Bulk (gramos)'] ||
        !row['Fecha Manufactura'] || !row['Fecha Vencimiento'] || !row['Línea de Mercado']) {
        console.error(`❌ Fila ${i + 1}: Faltan datos requeridos`);
        errorCount++;
        continue;
    }

    const name = row['Nombre del Producto'].replace(/'/g, "''");
    const lot = row['Lote'].replace(/'/g, "''");
    const supplierName = row['Proveedor'];
    const supplierId = supplierMap[supplierName];

    if (!supplierId) {
        console.warn(`⚠️  Fila ${i + 1}: Proveedor no encontrado en BD: "${supplierName}". Se omite esta muestra.`);
        skippedCount++;
        continue;
    }

    const ghsDangerClass = row['Clases de Peligro SGA PRINCIPAL'];
    const marketLineName = row['Línea de Mercado'];
    const marketLineId = marketLineMap[marketLineName];

    if (!marketLineId) {
        console.warn(`⚠️  Fila ${i + 1}: Línea de mercado no encontrada: "${marketLineName}". Se omite esta muestra.`);
        skippedCount++;
        continue;
    }

    const totalWeight = parseFloat(row['Peso Total del Bulk (gramos)']);
    if (isNaN(totalWeight) || totalWeight <= 0) {
        console.error(`❌ Fila ${i + 1}: Peso total inválido: ${row['Peso Total del Bulk (gramos)']}`);
        errorCount++;
        continue;
    }

    const manufactureDate = convertDate(row['Fecha Manufactura']);
    const expirationDate = convertDate(row['Fecha Vencimiento']);

    const signalWord = signalWordMap[row['Palabra de Señal']] || 'ATENCION';

    // Extraer pictogramas
    const pictograms = extractPictograms(row);
    const ghsPictogramsArray = pictograms.length > 0
        ? `ARRAY[${pictograms.map(p => `'${p}'`).join(',')}]`
        : 'ARRAY[]::text[]';

    const sampleId = generateUUID();

    // Construir INSERT con ghs_pictograms
    sql += `INSERT INTO global_samples (
    id, name, supplier_id, provider, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions, total_units, available_units,
    total_weight_grams, shelf_id, position_x, position_y, position_z,
    width, height, depth, coa_file_path, signal_word, dispensed_size, ghs_pictograms
  ) VALUES (
    '${sampleId}',
    '${name}',
    '${supplierId}',
    '${supplierName}',
    '${lot}',
    '${expirationDate}',
    '${manufactureDate}',
    '${ghsDangerClass}',
    '${marketLineId}',
    '1x1x1',
    0,
    0,
    ${totalWeight.toFixed(2)},
    NULL,
    NULL,
    NULL,
    0,
    1,
    1,
    1,
    NULL,
    '${signalWord}',
    '1x1x1',
    ${ghsPictogramsArray}
  );\n\n`;

    successCount++;
}

sql += 'COMMIT;\n';

// Guardar archivo SQL
const outputPath = path.join(__dirname, 'insercion_muestras.sql');
fs.writeFileSync(outputPath, sql, 'utf8');

console.log(`✅ Script SQL generado: ${outputPath}`);
console.log(`   - Registros exitosos: ${successCount}`);
console.log(`   - Registros omitidos (proveedor no encontrado): ${skippedCount}`);
console.log(`   - Errores: ${errorCount}`);

if (errorCount > 0 || skippedCount > 0) {
    console.log('\n⚠️  Revisa los errores y omisiones antes de ejecutar el script.');
} else {
    console.log('\n🎉 Listo para ejecutar en la base de datos.');
    console.log('   Comando: psql -U handler_user -d handler_track_samples -f database/insercion/insercion_muestras.sql');
}