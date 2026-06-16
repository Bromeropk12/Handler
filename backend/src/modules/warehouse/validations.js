/**
 * Warehouse Validations Module - 3D
 * Validaciones para anaqueles y compatibilidad SGA
 * 
 * Grid 3D: X = Columna (horizontal), Y = Nivel (vertical), Z = Profundidad
 * Las muestras ocupan width × height × depth celdas contiguas
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { areCompatible } = require('../../utils/sga-compatibility');
const { getNeighborsByAABB: _getNeighborsByAABB } = require('./group-operations');

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

  if (data.shelf_depth && (data.shelf_depth < 1 || data.shelf_depth > 50)) {
    throw new AppError('La profundidad del grid debe estar entre 1 y 50', 400);
  }
};

/**
 * Convierte dimensiones enum 3D a valores numéricos
 * Formato: Ancho(X) × Alto(Y) × Profundidad(Z)
 * 
 * '1x1x1' -> {width: 1, height: 1, depth: 1}
 * '1x2x1' -> {width: 1, height: 2, depth: 1}
 * '2x1x1' -> {width: 2, height: 1, depth: 1}
 * '2x2x1' -> {width: 2, height: 2, depth: 1}
 * '1x1x2' -> {width: 1, height: 1, depth: 2}
 * '1x2x2' -> {width: 1, height: 2, depth: 2}
 * '2x1x2' -> {width: 2, height: 1, depth: 2}
 * '2x2x2' -> {width: 2, height: 2, depth: 2}
 * 
 * Soporte retroactivo para formato 2D:
 * '1x1' -> {width: 1, height: 1, depth: 1}
 * '1x2' -> {width: 1, height: 2, depth: 1}
 * '2x1' -> {width: 2, height: 1, depth: 1}
 * '2x2' -> {width: 2, height: 2, depth: 1}
 */
function parseDimensions(dimensionsEnum) {
  const mapping3D = {
    '1x1x1': { width: 1, height: 1, depth: 1 },
    '1x2x1': { width: 1, height: 2, depth: 1 },
    '2x1x1': { width: 2, height: 1, depth: 1 },
    '2x2x1': { width: 2, height: 2, depth: 1 },
    '1x1x2': { width: 1, height: 1, depth: 2 },
    '1x2x2': { width: 1, height: 2, depth: 2 },
    '2x1x2': { width: 2, height: 1, depth: 2 },
    '2x2x2': { width: 2, height: 2, depth: 2 }
  };

  const mapping2D = {
    '1x1': { width: 1, height: 1, depth: 1 },
    '1x2': { width: 1, height: 2, depth: 1 },
    '2x1': { width: 2, height: 1, depth: 1 },
    '2x2': { width: 2, height: 2, depth: 1 }
  };

  const result = mapping3D[dimensionsEnum] || mapping2D[dimensionsEnum];
  if (!result) {
    throw new AppError(`Dimensiones inválidas: "${dimensionsEnum}". Use formato 3D (ej: 1x1x1) o 2D (ej: 1x1)`, 400);
  }
  return result;
}

/**
 * Verifica si dos cajas 3D se superponen
 * box = {x, y, z, w, h, d} donde x=columna, y=nivel, z=profundidad
 */
function boxesOverlap(box1, box2) {
  return !(box1.x + box1.w <= box2.x ||
           box2.x + box2.w <= box1.x ||
           box1.y + box1.h <= box2.y ||
           box2.y + box2.h <= box1.y ||
           box1.z + box1.d <= box2.z ||
           box2.z + box2.d <= box1.z);
}

/**
 * Obtiene muestras vecinas adyacentes para validación SGA en 3D.
 *
 * Refactor 2026-06: delega en `getNeighborsByAABB` (definida en
 * group-operations.js) para evitar duplicación de lógica con el flujo
 * de drag-en-grupo. Mantiene firma y comportamiento idénticos al
 * original.
 */
async function getNeighbors(shelfId, x, y, z, width, height, depth) {
  const adjacentSamples = await query(`
    SELECT ds.id, ds.position_x, ds.position_y, ds.position_z, ds.width, ds.height, ds.depth, gs.ghs_danger_class
    FROM dispensed_samples ds
    JOIN global_samples gs ON ds.global_sample_id = gs.id
    WHERE ds.shelf_id = $1 AND ds.status = 'stored'
      AND ds.position_x BETWEEN $2 - 4 AND $2 + $3 + 3
      AND ds.position_y BETWEEN $4 - 4 AND $4 + $5 + 3
      AND ds.position_z BETWEEN $6 - 4 AND $6 + $7 + 3
  `, [shelfId, x, width, y, height, z, depth]);

  // Construimos el AABB del target y delegamos el filtrado final a
  // getNeighborsByAABB (mismo radio=algoritmo).
  return _getNeighborsByAABB(
    { x, y, z, w: width, h: height, d: depth },
    adjacentSamples.rows
  );
}

/**
 * Re-exporta `getNeighborsByAABB` desde group-operations para
 * conveniencia de tests y de cualquier otro módulo que quiera
 * calcular vecinos sin ir a la base de datos.
 */
const getNeighborsByAABB = _getNeighborsByAABB;

/**
 * Valida el posicionamiento de una muestra en un anaquel 3D
 */
async function validatePlacement(shelf, sample, position_x, position_y, position_z) {
  const gridWidth = shelf.grid_width || 10;
  const gridHeight = shelf.grid_height || 10;
  const shelfDepth = shelf.shelf_depth || 10;
  const sampleWidth = sample.width || 1;
  const sampleHeight = sample.height || 1;
  const sampleDepth = sample.depth || 1;

  if (position_x < 0 || position_y < 0 || position_z < 0) {
    throw new AppError('Las posiciones no pueden ser negativas', 400);
  }

  if (position_y + sampleHeight > gridHeight) {
    throw new AppError(`El nivel excede el límite del anaquel (máx: ${gridHeight - sampleHeight})`, 400);
  }

  if (position_x + sampleWidth > gridWidth) {
    throw new AppError(`La muestra excede el límite horizontal del anaquel (máx: ${gridWidth - sampleWidth})`, 400);
  }

  if (position_z + sampleDepth > shelfDepth) {
    throw new AppError(`La muestra excede la profundidad del anaquel (máx: ${shelfDepth - sampleDepth})`, 400);
  }

  const occupiedCells = await query(`
    SELECT position_x, position_y, position_z, width, height, depth
    FROM dispensed_samples
    WHERE shelf_id = $1 AND status = 'stored' AND id != $2
      AND position_x IS NOT NULL AND position_y IS NOT NULL AND position_z IS NOT NULL
  `, [shelf.id, sample.id || null]);

  for (const occupied of occupiedCells.rows) {
    if (boxesOverlap(
      { x: position_x, y: position_y, z: position_z, w: sampleWidth, h: sampleHeight, d: sampleDepth },
      { x: occupied.position_x, y: occupied.position_y, z: occupied.position_z, w: occupied.width || 1, h: occupied.height || 1, d: occupied.depth || 1 }
    )) {
      throw new AppError('La posición se superpone con otra muestra', 400);
    }
  }

  const neighbors = await getNeighbors(shelf.id, position_x, position_y, position_z, sampleWidth, sampleHeight, sampleDepth);
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
 * Encuentra la mejor posición disponible para una muestra en un anaquel 3D
 */
async function findAutoPlacement(shelf, sample) {
  const occupiedResult = await query(`
    SELECT ds.position_x, ds.position_y, ds.position_z, ds.width, ds.height, ds.depth, gs.ghs_danger_class
    FROM dispensed_samples ds
    JOIN global_samples gs ON ds.global_sample_id = gs.id
    WHERE ds.shelf_id = $1 AND ds.status = 'stored'
      AND ds.position_x IS NOT NULL AND ds.position_y IS NOT NULL AND ds.position_z IS NOT NULL
  `, [shelf.id]);
  const occupied = occupiedResult.rows;

  const gridWidth = shelf.grid_width || 10;
  const gridHeight = shelf.grid_height || 10;
  const shelfDepth = shelf.shelf_depth || 10;
  const sampleWidth = sample.width || 1;
  const sampleHeight = sample.height || 1;
  const sampleDepth = sample.depth || 1;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x <= gridWidth - sampleWidth; x++) {
      for (let z = 0; z <= shelfDepth - sampleDepth; z++) {
        
        let collides = false;
        for (const occ of occupied) {
          if (boxesOverlap(
            { x, y, z, w: sampleWidth, h: sampleHeight, d: sampleDepth },
            { x: occ.position_x, y: occ.position_y, z: occ.position_z, w: occ.width || 1, h: occ.height || 1, d: occ.depth || 1 }
          )) {
            collides = true;
            break;
          }
        }

        if (collides) continue;

        let sgaConflict = false;
        for (const occ of occupied) {
          const dist = Math.abs(occ.position_x - x) + Math.abs(occ.position_y - y) + Math.abs(occ.position_z - z);
          if (dist <= 3 && dist > 0) {
            if (!areCompatible(sample.ghs_danger_class, occ.ghs_danger_class || 'Sin Riesgo')) {
              sgaConflict = true;
              break;
            }
          }
        }

        if (sgaConflict) continue;

        return { x, y, z };
      }
    }
  }

  throw new AppError(
    `No hay espacio disponible en el anaquel "${shelf.name}" para una muestra de dimensiones ${sampleWidth}x${sampleHeight}x${sampleDepth}`, 
    400
  );
}

/**
 * Calcula el porcentaje de ocupación de un anaquel 3D
 */
function calculateOccupancy(occupiedCells, shelf) {
  const totalCells = (shelf.grid_width || 10) * (shelf.grid_height || 10) * (shelf.shelf_depth || 10);
  return Math.round((occupiedCells / totalCells) * 100);
}

/**
 * Verifica si hay espacio suficiente para una muestra en un anaquel
 */
function hasPhysicalSpace(shelf, sample) {
  if (sample.width > shelf.grid_width || sample.height > shelf.grid_height || sample.depth > shelf.shelf_depth) {
    return false;
  }
  return true;
}

module.exports = {
  validateShelfData,
  parseDimensions,
  boxesOverlap,
  validatePlacement,
  getNeighbors,
  getNeighborsByAABB,
  findAutoPlacement,
  calculateOccupancy,
  hasPhysicalSpace
};