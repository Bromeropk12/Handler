const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'insercion_de_Muetras.csv');
const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split('\n').filter(l => l.trim());
const headers = lines[0].split(';');

const pictogramCols = [
    'Explosivo', 'Inflamable', 'Comburente', 'Gas Bajo Presión',
    'Corrosivo', 'Toxicidad Aguda', 'Irritante', 'Toxicidad Crónica', 'Tóxico para Medio Ambiente'
];

let maxPictos = 0;
let samplesWithMany = [];

for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(';');
    const row = {};
    headers.forEach((h, idx) => row[h.trim()] = vals[idx]?.trim() || '');

    const count = pictogramCols.filter(col => row[col] && row[col].toLowerCase() === 'si').length;
    if (count > maxPictos) maxPictos = count;
    if (count > 4) samplesWithMany.push({ name: row['Nombre del Producto'], count });
}

console.log('Máximo pictogramas en una muestra:', maxPictos);
if (samplesWithMany.length) {
    console.log('⚠️  Muestras con >4 pictogramas:', samplesWithMany);
} else {
    console.log('✅ Ninguna muestra supera los 4 pictogramas. Límite correcto.');
}