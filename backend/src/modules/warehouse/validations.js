/**
 * Warehouse Validations Module
 * Validaciones para anaqueles y compatibilidad SGA
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

// Validaciones para datos de anaquel
const validateShelfData = (data) => {
  const required = ['market_line_id', 'name'];

  for (const field of required) {
    if (!data[field]) {
      throw new AppError(`Campo requerido faltante: ${field}`, 400);
    }
  }

  if (data.grid_width && (data.grid_width < 1 || data.grid_width > 50)) {
    throw new AppError('El ancho del grid debe estar entre 1 y 50', 400);
  }

  if (data.grid_height && (data.grid_height < 1 || data.grid_height > 50)) {
    throw new AppError('El alto del grid debe estar entre 1 y 50', 400);
  }
};

// Matriz de compatibilidad SGA (Sistema Globalmente Armonizado)
// true = compatible, false = incompatible
const SGA_COMPATIBILITY_MATRIX = {
  'Sin Riesgo': ['Sin Riesgo', 'Inflamable', 'Corrosivo', 'Toxico', 'Comburente', 'Explosivo'],
  'Inflamable': ['Sin Riesgo', 'Inflamable'], // Solo con sin riesgo e inflamables
  'Corrosivo': ['Sin Riesgo', 'Corrosivo'], // Solo con sin riesgo y corrosivos
  'Toxico': ['Sin Riesgo'], // Solo con sin riesgo
  'Comburente': ['Sin Riesgo', 'Comburente'], // Solo con sin riesgo y comburentes
  'Explosivo': ['Sin Riesgo'] // Solo con sin riesgo
};

/**
 * Verifica si dos clases SGA son compatibles para estar en anaqueles adyacentes
 */
function isSGACompatible(class1, class2) {
  return SGA_COMPATIBILITY_MATRIX[class1]?.includes(class2) || false;
}

/**
 * Convierte dimensiones enum a valores numéricos
 */
function parseDimensions(dimensionsEnum) {
  const mapping = {
    '1x1': { width: 1, height: 1 },
    '1x2': { width: 1, height: 2 },
    '2x1': { width: 2, height: 1 },
    '2x2': { width: 2, height: 2 }
  };
  return mapping[dimensionsEnum] || { width: 1, height: 1 };
}

/**
 * Valida el posicionamiento de una muestra en un anaquel
 * Verifica límites, overlap y compatibilidad SGA
 */
async function validatePlacement(shelf, sample, position_x, position_y, position_z) {
  // Verificar límites del grid (Y es el Nivel, X es Columna, Z es Profundidad)
  if (position_x < 0 || position_y < 0 || position_z < 0) {
    throw new AppError('Las posiciones no pueden ser negativas', 400);
  }

  if (position_y >= shelf.grid_height) {
    throw new AppError('El nivel excede el límite del anaquel', 400);
  }

  if (position_x + sample.width > shelf.grid_width) {
    throw new AppError('La muestra excede el límite horizontal del anaquel', 400);
  }

  // sample.height se interpreta como ocupación de profundidad (Z)
  if (position_z + sample.height > shelf.shelf_depth) {
    throw new AppError('La muestra excede el límite de profundidad (fondo) del anaquel', 400);
  }

  // Verificar overlap con otras muestras en EL MISMO NIVEL (position_y)
  const occupiedCells = await query(`
    SELECT position_x, position_y, position_z, width, height
    FROM dispensed_samples
    WHERE shelf_id = $1 AND position_y = $2 AND status = 'stored' AND id != $3
  `, [shelf.id, position_y, sample.id || null]);

  for (const occupied of occupiedCells.rows) {
    if (rectanglesOverlap(
      { x: position_x, z: position_z, w: sample.width, d: sample.height },
      { x: occupied.position_x, z: occupied.position_z, w: occupied.width, d: occupied.height }
    )) {
      throw new AppError('La posición se superpone con otra muestra en el mismo nivel', 400);
    }
  }

  // Verificar compatibilidad SGA con vecinos adyacentes en el mismo nivel
  const neighbors = await getNeighbors(shelf.id, position_x, position_y, position_z, sample.width, sample.height);
  for (const neighbor of neighbors) {
    if (!isSGACompatible(sample.ghs_danger_class, neighbor.ghs_danger_class)) {
      throw new AppError(`Incompatibilidad química con muestra vecina (${neighbor.ghs_danger_class})`, 400);
    }
  }
}

/**
 * Verifica si dos rectángulos se superponen
 */
function rectanglesOverlap(rect1, rect2) {
  // rect1 y rect2 usan x (columna), z (profundidad), w (ancho), y d (largo de profundidad)
  return !(rect1.x + rect1.w <= rect2.x ||
           rect2.x + rect2.w <= rect1.x ||
           rect1.z + rect1.d <= rect2.z ||
           rect2.z + rect2.d <= rect1.z);
}

/**
 * Obtiene muestras vecinas adyacentes para validación SGA
 */
async function getNeighbors(shelfId, x, y, z, width, depth) {
  // Vecinos en el MISMO piso (y). Son vecinos si tocan sus bordes X o Z.
  // Es decir, (overlap en plano XZ extendido por 1 unidad radial).
  const adjacentSamples = await query(`
    SELECT DISTINCT ds.id, gs.ghs_danger_class
    FROM dispensed_samples ds
    JOIN global_samples gs ON ds.global_sample_id = gs.id
    WHERE ds.shelf_id = $1 AND ds.position_y = $2 AND ds.status = 'stored' AND (
      (ds.position_x + ds.width = $3 AND ds.position_z <= $4 + $5 - 1 AND ds.position_z + ds.height - 1 >= $4) OR
      (ds.position_x = $3 + $6 AND ds.position_z <= $4 + $5 - 1 AND ds.position_z + ds.height - 1 >= $4) OR
      (ds.position_z + ds.height = $4 AND ds.position_x <= $3 + $6 - 1 AND ds.position_x + ds.width - 1 >= $3) OR
      (ds.position_z = $4 + $5 AND ds.position_x <= $3 + $6 - 1 AND ds.position_x + ds.width - 1 >= $3)
    )
  `, [shelfId, y, x, z, depth, width]);

  return adjacentSamples.rows;
}

/**
 * Encuentra espacio vacío llenando desde el fondo (max Z) hacia el frente (0).
 */
async function findAutoPlacement(shelf, sample) {
  const occupiedResult = await query(`
    SELECT position_x, position_y, position_z, width, height
    FROM dispensed_samples
    WHERE shelf_id = $1 AND status = 'stored'
  `, [shelf.id]);
  const occupied = occupiedResult.rows;

  const levels = shelf.grid_height || 10;
  const cols = shelf.grid_width || 10;
  const maxDepth = shelf.shelf_depth || 10;

  for (let y = 0; y < levels; y++) {
    // Desde el fondo de la caja hacia enfrente
    for (let z = maxDepth - sample.height; z >= 0; z--) {
      for (let x = 0; x <= cols - sample.width; x++) {
        
        let collides = false;
        for (const occ of occupied) {
          if (occ.position_y === y && rectanglesOverlap(
            { x: x, z: z, w: sample.width, d: sample.height },
            { x: occ.position_x, z: occ.position_z, w: occ.width, d: occ.height }
          )) {
            collides = true;
            break;
          }
        }

        if (collides) continue;

        // Si no choca, verificamos química SGA real con la BD
        try {
          await validatePlacement(shelf, sample, x, y, z);
          return { x, y, z };
        } catch(e) {
          continue;
        }
      }
    }
  }

  throw new AppError('No hay espacio disponible (o compatible químicamente) para esta muestra', 400);
}

module.exports = {
  validateShelfData,
  isSGACompatible,
  parseDimensions,
  validatePlacement,
  getNeighbors,
  findAutoPlacement
};