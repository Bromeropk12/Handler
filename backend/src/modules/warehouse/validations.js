/**
 * Warehouse Validations Module
 * Validaciones para anaqueles y compatibilidad SGA
 * 
 * Grid 2D: X = Columna (horizontal), Y = Nivel (vertical)
 * Las muestras ocupan width x height celdas contiguas
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { areCompatible, getMinimumDistance } = require('../../utils/sga-compatibility');

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

/**
 * Convierte dimensiones enum a valores numéricos
 * '1x1' -> {width: 1, height: 1}
 * '1x2' -> {width: 1, height: 2} (1 columna, 2 niveles)
 * '2x1' -> {width: 2, height: 1} (2 columnas, 1 nivel)
 * '2x2' -> {width: 2, height: 2} (2 columnas, 2 niveles)
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
 * Verifica si dos rectángulos 2D se superponen
 * rect = {x, y, w, h} donde x=columna, y=nivel
 */
function rectanglesOverlap(rect1, rect2) {
  return !(rect1.x + rect1.w <= rect2.x ||
           rect2.x + rect2.w <= rect1.x ||
           rect1.y + rect1.h <= rect2.y ||
           rect2.y + rect2.h <= rect1.y);
}

/**
 * Obtiene muestras vecinas adyacentes para validación SGA
 * Vecinos son muestras en el mismo anaquel cuyo centro está a distancia <= 2
 */
async function getNeighbors(shelfId, x, y, width, height) {
  // Buscar muestras cuyas celdas estén dentro de un radio de 2 celdas
  const adjacentSamples = await query(`
    SELECT ds.id, ds.position_x, ds.position_y, ds.width, ds.height, gs.ghs_danger_class
    FROM dispensed_samples ds
    JOIN global_samples gs ON ds.global_sample_id = gs.id
    WHERE ds.shelf_id = $1 AND ds.status = 'stored'
      AND ds.position_x BETWEEN $2 - 3 AND $2 + $3 + 2
      AND ds.position_y BETWEEN $4 - 3 AND $4 + $5 + 2
  `, [shelfId, x, width, y, height]);

  // Filtrar solo las que realmente están adyacentes (distancia Manhattan <= 2)
  return adjacentSamples.rows.filter(s => {
    const dist = Math.abs(s.position_x - x) + Math.abs(s.position_y - y);
    return dist <= 3 && dist > 0; // Excluir la misma posición
  });
}

/**
 * Valida el posicionamiento de una muestra en un anaquel
 * Verifica límites del grid, overlap y compatibilidad SGA
 */
async function validatePlacement(shelf, sample, position_x, position_y) {
  // Verificar límites del grid 2D
  if (position_x < 0 || position_y < 0) {
    throw new AppError('Las posiciones no pueden ser negativas', 400);
  }

  if (position_y + sample.height > shelf.grid_height) {
    throw new AppError(`El nivel excede el límite del anaquel (máx: ${shelf.grid_height - sample.height})`, 400);
  }

  if (position_x + sample.width > shelf.grid_width) {
    throw new AppError(`La muestra excede el límite horizontal del anaquel (máx: ${shelf.grid_width - sample.width})`, 400);
  }

  // Verificar overlap con otras muestras
  const occupiedCells = await query(`
    SELECT position_x, position_y, width, height
    FROM dispensed_samples
    WHERE shelf_id = $1 AND status = 'stored' AND id != $2
  `, [shelf.id, sample.id || null]);

  for (const occupied of occupiedCells.rows) {
    if (rectanglesOverlap(
      { x: position_x, y: position_y, w: sample.width, h: sample.height },
      { x: occupied.position_x, y: occupied.position_y, w: occupied.width, h: occupied.height }
    )) {
      throw new AppError('La posición se superpone con otra muestra', 400);
    }
  }

  // Verificar compatibilidad SGA con vecinos adyacentes
  const neighbors = await getNeighbors(shelf.id, position_x, position_y, sample.width, sample.height);
  for (const neighbor of neighbors) {
    if (!areCompatible(sample.ghs_danger_class, neighbor.ghs_danger_class)) {
      throw new AppError(
        `Incompatibilidad SGA: ${sample.ghs_danger_class} no puede estar junto a ${neighbor.ghs_danger_class}`, 
        400
      );
    }
  }
}

/**
 * Encuentra la mejor posición disponible para una muestra en un anaquel
 * 
 * Algoritmo:
 * 1. Recorre el grid nivel por nivel (de abajo hacia arriba)
 * 2. Dentro de cada nivel, recorre de izquierda a derecha
 * 3. Para cada posición posible, verifica:
 *    a. No hay overlap con muestras existentes
 *    b. Es compatible SGA con vecinos adyacentes
 * 4. Retorna la primera posición válida encontrada
 * 
 * @param {object} shelf - Datos del anaquel (id, grid_width, grid_height)
 * @param {object} sample - Datos de la muestra (width, height, ghs_danger_class, id)
 * @returns {object} {x, y} - Coordenadas de la posición encontrada
 */
async function findAutoPlacement(shelf, sample) {
  // Obtener todas las muestras ocupadas en el anaquel
  const occupiedResult = await query(`
    SELECT position_x, position_y, width, height
    FROM dispensed_samples
    WHERE shelf_id = $1 AND status = 'stored'
  `, [shelf.id]);
  const occupied = occupiedResult.rows;

  const levels = shelf.grid_height || 10;
  const cols = shelf.grid_width || 10;

  // Recorrer nivel por nivel (de abajo hacia arriba)
  for (let y = 0; y < levels; y++) {
    // Dentro de cada nivel, de izquierda a derecha
    for (let x = 0; x <= cols - sample.width; x++) {
      
      // Verificar overlap
      let collides = false;
      for (const occ of occupied) {
        if (rectanglesOverlap(
          { x, y, w: sample.width, h: sample.height },
          { x: occ.position_x, y: occ.position_y, w: occ.width, h: occ.height }
        )) {
          collides = true;
          break;
        }
      }

      if (collides) continue;

      // Si no choca físicamente, verificar compatibilidad SGA
      // Obtener vecinos en esta posición potencial
      const neighbors = occupied
        .filter(occ => {
          const dist = Math.abs(occ.position_x - x) + Math.abs(occ.position_y - y);
          return dist <= 3 && dist > 0;
        })
        .map(occ => ({
          id: occ.position_x, // placeholder
          ghs_danger_class: occ.ghs_danger_class || 'Sin Riesgo',
          position_x: occ.position_x,
          position_y: occ.position_y
        }));

      // Para verificación SGA real, necesitamos las clases de peligro de las ocupadas
      // Hacemos una query adicional solo si hay vecinos cercanos
      if (neighbors.length > 0) {
        const realNeighbors = await query(`
          SELECT ds.id, gs.ghs_danger_class, ds.position_x, ds.position_y
          FROM dispensed_samples ds
          JOIN global_samples gs ON ds.global_sample_id = gs.id
          WHERE ds.shelf_id = $1 AND ds.status = 'stored'
            AND ds.position_x BETWEEN $2 - 3 AND $2 + $3 + 2
            AND ds.position_y BETWEEN $4 - 3 AND $4 + $5 + 2
        `, [shelf.id, x, sample.width, y, sample.height]);

        let sgaConflict = false;
        for (const neighbor of realNeighbors.rows) {
          const dist = Math.abs(neighbor.position_x - x) + Math.abs(neighbor.position_y - y);
          if (dist <= 3 && dist > 0) {
            if (!areCompatible(sample.ghs_danger_class, neighbor.ghs_danger_class)) {
              sgaConflict = true;
              break;
            }
          }
        }

        if (sgaConflict) continue;
      }

      // Posición válida encontrada
      return { x, y };
    }
  }

  throw new AppError(
    `No hay espacio disponible en el anaquel "${shelf.name}" para una muestra de dimensiones ${sample.width}x${sample.height}`, 
    400
  );
}

/**
 * Calcula el porcentaje de ocupación de un anaquel
 * 
 * @param {object} shelf - Datos del anaquel
 * @param {number} occupiedCells - Celdas ocupadas
 * @returns {number} Porcentaje de ocupación (0-100)
 */
function calculateOccupancy(shelf, occupiedCells) {
  const totalCells = (shelf.grid_width || 10) * (shelf.grid_height || 10);
  return Math.round((occupiedCells / totalCells) * 100);
}

/**
 * Verifica si hay espacio suficiente para una muestra en un anaquel
 * (sin verificar compatibilidad SGA, solo espacio físico)
 * 
 * @param {object} shelf - Datos del anaquel
 * @param {object} sample - Dimensiones de la muestra {width, height}
 * @returns {boolean} true si hay espacio físico
 */
function hasPhysicalSpace(shelf, sample) {
  // Si la muestra es más grande que el anaquel, no cabe
  if (sample.width > shelf.grid_width || sample.height > shelf.grid_height) {
    return false;
  }
  // Hay al menos una celda del tamaño necesario
  return true;
}

module.exports = {
  validateShelfData,
  parseDimensions,
  rectanglesOverlap,
  validatePlacement,
  getNeighbors,
  findAutoPlacement,
  calculateOccupancy,
  hasPhysicalSpace
};