/**
 * Defragmentation Algorithm - 3D
 * Calcula los movimientos mínimos necesarios para crear espacio contiguo
 * en un anaquel 3D para una muestra de tamaño dado.
 *
 * Estrategia:
 * 1. Construye un mapa binario 3D del grid (libre/ocupado)
 * 2. Busca espacio libre en 3D (X × Y × Z)
 * 3. Si no hay espacio suficiente, genera instrucciones de movimiento
 *    para despejar la zona más conveniente con el menor número de pasos.
 *
 * Grid 3D: X = columna, Y = nivel (fila), Z = profundidad
 */

const { areCompatible } = require('./sga-compatibility');

/**
 * Construye la matriz de ocupación 3D del grid a partir de las muestras actuales.
 * Retorna matrix[y][z][x] = { occupied: bool, sampleId, dangerClass, ... }
 */
function buildOccupancyMap3D(gridWidth, gridHeight, shelfDepth, samples) {
  const matrix = [];
  for (let y = 0; y < gridHeight; y++) {
    matrix[y] = [];
    for (let z = 0; z < shelfDepth; z++) {
      matrix[y][z] = [];
      for (let x = 0; x < gridWidth; x++) {
        matrix[y][z][x] = { occupied: false, sampleId: null, dangerClass: null };
      }
    }
  }

  for (const sample of samples) {
    const posX = sample.position_x;
    const posY = sample.position_y;
    const posZ = sample.position_z || 0;
    if (posX < 0 || posY < 0 || posZ < 0) continue;
    const w = sample.width || 1;
    const h = sample.height || 1;
    const d = sample.depth || 1;
    for (let dy = 0; dy < h; dy++) {
      for (let dz = 0; dz < d; dz++) {
        for (let dx = 0; dx < w; dx++) {
          const cy = posY + dy;
          const cz = posZ + dz;
          const cx = posX + dx;
          if (cy < gridHeight && cz < shelfDepth && cx < gridWidth) {
            matrix[cy][cz][cx] = {
              occupied: true,
              sampleId: sample.id,
              sampleName: sample.name || sample.global_sample_name || sample.id,
              shelfName: sample.shelf_name || null,
              dangerClass: sample.ghs_danger_class || 'Sin Riesgo',
              posX: sample.position_x,
              posY: sample.position_y,
              posZ: sample.position_z || 0,
              width: w,
              height: h,
              depth: d,
            };
          }
        }
      }
    }
  }

  return matrix;
}

/**
 * Verifica si existe un bloque de tamaño targetW × targetH × targetD completamente libre
 * en la matriz 3D. Retorna la primera posición (x, y, z) encontrada o null.
 */
function findFreeBlock3D(matrix, gridWidth, gridHeight, shelfDepth, targetW, targetH, targetD) {
  for (let y = 0; y <= gridHeight - targetH; y++) {
    for (let z = 0; z <= shelfDepth - targetD; z++) {
      for (let x = 0; x <= gridWidth - targetW; x++) {
        let free = true;
        outer: for (let dy = 0; dy < targetH; dy++) {
          for (let dz = 0; dz < targetD; dz++) {
            for (let dx = 0; dx < targetW; dx++) {
              const cy = y + dy;
              const cz = z + dz;
              const cx = x + dx;
              if (cy >= gridHeight || cz >= shelfDepth || cx >= gridWidth) {
                free = false;
                break outer;
              }
              if (matrix[cy][cz][cx].occupied) {
                free = false;
                break outer;
              }
            }
          }
        }
        if (free) return { x, y, z };
      }
    }
  }
  return null;
}

/**
 * Lista todas las muestras únicas que bloquean un bloque candidato 3D.
 */
function getBlockers3D(matrix, x, y, z, targetW, targetH, targetD) {
  const seen = new Set();
  const blockers = [];
  for (let dy = 0; dy < targetH; dy++) {
    for (let dz = 0; dz < targetD; dz++) {
      for (let dx = 0; dx < targetW; dx++) {
        const cy = y + dy;
        const cz = z + dz;
        const cx = x + dx;
        if (cy >= gridHeight || cz >= shelfDepth || cx >= gridWidth) continue;
        const cell = matrix[cy][cz][cx];
        if (cell.occupied && !seen.has(cell.sampleId)) {
          seen.add(cell.sampleId);
          blockers.push(cell);
        }
      }
    }
  }
  return blockers;
}

/**
 * Encuentra la mejor zona libre 3D donde reubicar una muestra,
 * excluyendo la zona reservada.
 */
function findRelocationSpot3D(
  matrix, gridWidth, gridHeight, shelfDepth,
  sampleW, sampleH, sampleD, dangerClass, excludeSampleId,
  targetX, targetY, targetZ, targetW, targetH, targetD
) {
  for (let y = 0; y <= gridHeight - sampleH; y++) {
    for (let z = 0; z <= shelfDepth - sampleD; z++) {
      for (let x = 0; x <= gridWidth - sampleW; x++) {
        const overlapsTarget =
          x < targetX + targetW && x + sampleW > targetX &&
          y < targetY + targetH && y + sampleH > targetY &&
          z < targetZ + targetD && z + sampleD > targetZ;
        if (overlapsTarget) continue;

        let free = true;
        outer: for (let dy = 0; dy < sampleH; dy++) {
          for (let dz = 0; dz < sampleD; dz++) {
            for (let dx = 0; dx < sampleW; dx++) {
              const cell = matrix[y + dy][z + dz][x + dx];
              if (cell.occupied && cell.sampleId !== excludeSampleId) {
                free = false;
                break outer;
              }
            }
          }
        }
        if (!free) continue;

        let sgaOk = true;
        const deltas = [
          [-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1],
        ];
        outer2: for (const [ddx, ddy, ddz] of deltas) {
          for (let dy = 0; dy < sampleH; dy++) {
            for (let dz = 0; dz < sampleD; dz++) {
              for (let dx = 0; dx < sampleW; dx++) {
                const ny = y + dy + ddy;
                const nz = z + dz + ddz;
                const nx = x + dx + ddx;
                if (ny < 0 || ny >= gridHeight || nz < 0 || nz >= shelfDepth || nx < 0 || nx >= gridWidth) continue;
                const neighbor = matrix[ny][nz][nx];
                if (neighbor.occupied && neighbor.sampleId !== excludeSampleId && !areCompatible(dangerClass, neighbor.dangerClass)) {
                  sgaOk = false;
                  break outer2;
                }
              }
            }
          }
        }
        if (!sgaOk) continue;

        return { x, y, z };
      }
    }
  }
  return null;
}

/**
 * Algoritmo principal de desfragmentación 3D.
 *
 * @param {object} shelf - { id, name, grid_width, grid_height, shelf_depth }
 * @param {Array} samples - Array de muestras con position_x, position_y, position_z, width, height, depth, ghs_danger_class, id
 * @param {number} targetW - Ancho de la muestra que necesita espacio
 * @param {number} targetH - Alto de la muestra que necesita espacio
 * @param {number} targetD - Profundidad de la muestra que necesita espacio
 * @returns {object} { possible, freeSpaceFound, freeBlock, moves, message }
 */
function calculateDefragmentation3D(shelf, samples, targetW, targetH, targetD) {
  const gridWidth = shelf.grid_width || 10;
  const gridHeight = shelf.grid_height || 10;
  const shelfDepth = shelf.shelf_depth || 10;

  if (targetW > gridWidth || targetH > gridHeight || targetD > shelfDepth) {
    return {
      possible: false,
      freeSpaceFound: false,
      freeBlock: null,
      moves: [],
      message: `La muestra (${targetW}x${targetH}x${targetD}) es más grande que el anaquel (${gridWidth}x${gridHeight}x${shelfDepth}).`,
    };
  }

  let currentSamples = samples.map(s => ({ ...s }));
  let matrix = buildOccupancyMap3D(gridWidth, gridHeight, shelfDepth, currentSamples);

  const existingFree = findFreeBlock3D(matrix, gridWidth, gridHeight, shelfDepth, targetW, targetH, targetD);
  if (existingFree) {
    return {
      possible: true,
      freeSpaceFound: true,
      freeBlock: existingFree,
      moves: [],
      message: `Ya existe un espacio libre en (X:${existingFree.x + 1}, Y:${existingFree.y + 1}, Z:${existingFree.z + 1}). No se requiere desfragmentación.`,
    };
  }

  const moves = [];
  const MAX_ITERATIONS = 100;
  let iterations = 0;
  let finalFreeBlock = null;

  const candidates = [];
  for (let y = 0; y <= gridHeight - targetH; y++) {
    for (let z = 0; z <= shelfDepth - targetD; z++) {
      for (let x = 0; x <= gridWidth - targetW; x++) {
        const blockers = getBlockers3D(matrix, x, y, z, targetW, targetH, targetD);
        candidates.push({ x, y, z, blockerCount: blockers.length, blockers });
      }
    }
  }
  candidates.sort((a, b) => a.blockerCount - b.blockerCount);

  for (const candidate of candidates) {
    if (candidate.blockerCount === 0) {
      finalFreeBlock = { x: candidate.x, y: candidate.y, z: candidate.z };
      break;
    }

    const attemptMoves = [];
    let candidateFeasible = true;
    const simulatedMatrix = buildOccupancyMap3D(gridWidth, gridHeight, shelfDepth, currentSamples);

    const tgtX = candidate.x;
    const tgtY = candidate.y;
    const tgtZ = candidate.z;

    for (const blocker of candidate.blockers) {
      if (iterations >= MAX_ITERATIONS) {
        candidateFeasible = false;
        break;
      }

      const spot = findRelocationSpot3D(
        simulatedMatrix, gridWidth, gridHeight, shelfDepth,
        blocker.width, blocker.height, blocker.depth,
        blocker.dangerClass, blocker.sampleId,
        tgtX, tgtY, tgtZ, targetW, targetH, targetD
      );

      if (!spot) {
        candidateFeasible = false;
        break;
      }

      for (let dy = 0; dy < blocker.height; dy++) {
        for (let dz = 0; dz < blocker.depth; dz++) {
          for (let dx = 0; dx < blocker.width; dx++) {
            simulatedMatrix[blocker.posY + dy][blocker.posZ + dz][blocker.posX + dx] = {
              occupied: false, sampleId: null, dangerClass: null,
            };
          }
        }
      }
      for (let dy = 0; dy < blocker.height; dy++) {
        for (let dz = 0; dz < blocker.depth; dz++) {
          for (let dx = 0; dx < blocker.width; dx++) {
            simulatedMatrix[spot.y + dy][spot.z + dz][spot.x + dx] = {
              occupied: true, sampleId: blocker.sampleId,
              sampleName: blocker.sampleName, dangerClass: blocker.dangerClass,
              posX: spot.x, posY: spot.y, posZ: spot.z,
              width: blocker.width, height: blocker.height, depth: blocker.depth,
            };
          }
        }
      }

      attemptMoves.push({
        sampleId: blocker.sampleId,
        sampleName: blocker.sampleName,
        fromX: blocker.posX, fromY: blocker.posY, fromZ: blocker.posZ,
        toX: spot.x, toY: spot.y, toZ: spot.z,
        width: blocker.width, height: blocker.height, depth: blocker.depth,
        dangerClass: blocker.dangerClass,
      });

      iterations++;
    }

    if (candidateFeasible) {
      finalFreeBlock = { x: tgtX, y: tgtY, z: tgtZ };
      moves.push(...attemptMoves);
      break;
    }
  }

  if (!finalFreeBlock) {
    return {
      possible: false,
      freeSpaceFound: false,
      freeBlock: null,
      moves: [],
      message: `No es posible crear espacio para una muestra de ${targetW}x${targetH}x${targetD} en el anaquel "${shelf.name}". El anaquel está lleno o hay conflictos SGA irresolubles.`,
    };
  }

  const instructions = moves.map((mv, i) => ({
    step: i + 1,
    sampleId: mv.sampleId,
    sampleName: mv.sampleName,
    fromX: mv.fromX, fromY: mv.fromY, fromZ: mv.fromZ,
    toX: mv.toX, toY: mv.toY, toZ: mv.toZ,
    instruction: `Mover "${mv.sampleName}" de (Col ${mv.fromX + 1}, Nivel ${mv.fromY + 1}, Prof ${mv.fromZ + 1}) a (Col ${mv.toX + 1}, Nivel ${mv.toY + 1}, Prof ${mv.toZ + 1})`,
    details: {
      from: { x: mv.fromX, y: mv.fromY, z: mv.fromZ },
      to: { x: mv.toX, y: mv.toY, z: mv.toZ },
      dimensions: `${mv.width}x${mv.height}x${mv.depth}`,
      dangerClass: mv.dangerClass,
    },
  }));

  return {
    possible: true,
    freeSpaceFound: false,
    freeBlock: finalFreeBlock,
    moves: instructions,
    message:
      instructions.length === 0
        ? `Espacio libre encontrado en (Col ${finalFreeBlock.x + 1}, Nivel ${finalFreeBlock.y + 1}, Prof ${finalFreeBlock.z + 1}).`
        : `Se requieren ${instructions.length} movimiento(s) para liberar espacio en (Col ${finalFreeBlock.x + 1}, Nivel ${finalFreeBlock.y + 1}, Prof ${finalFreeBlock.z + 1}).`,
  };
}

module.exports = {
  calculateDefragmentation3D,
  buildOccupancyMap3D,
  findFreeBlock3D,
};
