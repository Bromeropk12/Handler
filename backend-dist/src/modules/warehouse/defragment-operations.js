/**
 * Defragmentation Operations - 3D
 * Controladores para el endpoint de desfragmentación de anaqueles
 *
 * POST /api/warehouse/:id/defragment        → Calcular movimientos (sin ejecutar)
 * POST /api/warehouse/:id/defragment/confirm → Confirmar y ejecutar un movimiento
 */

const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { calculateDefragmentation3D } = require('../../utils/defragmentation');
const { parseDimensions } = require('./validations');

/**
 * POST /api/warehouse/:id/defragment
 *
 * Body: { target_width, target_height, target_depth }
 *   -> Opcionalmente puede venir 'dimensions' como enum 3D ('1x1x1', '2x2x1', etc.)
 *
 * Retorna el plan de desfragmentación (lista de movimientos) sin ejecutar nada.
 */
const defragmentShelf = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { target_width, target_height, target_depth, dimensions } = req.body;

    // Soporte para pasar 'dimensions' como enum string 3D
    if (dimensions && !target_width && !target_height) {
      const parsed = parseDimensions(dimensions);
      target_width = parsed.width;
      target_height = parsed.height;
      target_depth = parsed.depth;
    }

    target_width = parseInt(target_width, 10) || 1;
    target_height = parseInt(target_height, 10) || 1;
    target_depth = parseInt(target_depth, 10) || 1;

    if (target_width < 1 || target_height < 1 || target_depth < 1) {
      throw new AppError('Las dimensiones objetivo deben ser al menos 1x1x1', 400);
    }

    // Verificar anaquel
    const shelfResult = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    if (shelfResult.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }
    const shelf = shelfResult.rows[0];

    // Obtener muestras actuales del anaquel
    const samplesResult = await query(`
      SELECT
        ds.id,
        ds.position_x,
        ds.position_y,
        ds.position_z,
        COALESCE(ds.width, 1) as width,
        COALESCE(ds.height, 1) as height,
        COALESCE(ds.depth, 1) as depth,
        gs.name AS name,
        gs.ghs_danger_class,
        gs.dimensions AS dimensions_enum
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      WHERE ds.shelf_id = $1 AND ds.status = 'stored'
      ORDER BY ds.position_y ASC, ds.position_z ASC, ds.position_x ASC
    `, [id]);

    // Si no hay muestras, no hay nada que desfragmentar
    if (samplesResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          shelf: {
            id: shelf.id,
            name: shelf.name,
            grid_width: shelf.grid_width,
            grid_height: shelf.grid_height,
            shelf_depth: shelf.shelf_depth,
          },
          target: { width: target_width, height: target_height, depth: target_depth },
          possible: true,
          freeSpaceFound: true,
          freeBlock: { x: 0, y: 0, z: 0 },
          totalMoves: 0,
          moves: [],
          message: `El anaquel "${shelf.name}" está vacío. Hay espacio disponible en (Col 1, Nivel 1, Prof 1).`,
        },
      });
    }

    // Asegurar que width/height/depth estén calculados desde el enum si no están guardados
    // Y filtrar muestras que no tengan posiciones válidas (es decir, null)
    const samples = samplesResult.rows
      .filter(s => s.position_x !== null && s.position_y !== null && s.position_z !== null)
      .map(s => {
        if (!s.width || !s.height || !s.depth) {
          const dims = parseDimensions(s.dimensions_enum);
          return { ...s, width: s.width || dims.width, height: s.height || dims.height, depth: s.depth || dims.depth };
        }
        return s;
      });

    // Ejecutar algoritmo de desfragmentación 3D
    const plan = calculateDefragmentation3D(shelf, samples, target_width, target_height, target_depth);

    return res.json({
      success: true,
      data: {
        shelf: {
          id: shelf.id,
          name: shelf.name,
          grid_width: shelf.grid_width,
          grid_height: shelf.grid_height,
          shelf_depth: shelf.shelf_depth,
        },
        target: { width: target_width, height: target_height, depth: target_depth },
        possible: plan.possible,
        freeSpaceFound: plan.freeSpaceFound,
        freeBlock: plan.freeBlock,
        totalMoves: plan.moves.length,
        moves: plan.moves,
        message: plan.message,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/warehouse/:id/defragment/confirm
 *
 * Confirma y ejecuta UN movimiento de desfragmentación.
 *
 * Body: {
 *   sample_id: string,
 *   from_x: number, from_y: number, from_z: number,
 *   to_x: number, to_y: number, to_z: number
 * }
 *
 * El frontend envía de a uno, y el sistema actualiza la BD y registra el movimiento.
 */
const confirmDefragMove = async (req, res, next) => {
  try {
    const { id } = req.params; // shelf_id
    const { sample_id, from_x, from_y, from_z, to_x, to_y, to_z } = req.body;

    if (!sample_id || to_x === undefined || to_y === undefined) {
      throw new AppError('Se requieren: sample_id, to_x, to_y', 400);
    }

    const finalZ = to_z !== undefined ? to_z : 0;

    // Verificar anaquel
    const shelfResult = await query('SELECT * FROM shelves WHERE id = $1', [id]);
    if (shelfResult.rows.length === 0) {
      throw new AppError('Anaquel no encontrado', 404);
    }

    // Verificar que la muestra existe en este anaquel
    const sampleResult = await query(`
      SELECT ds.*, gs.name AS global_sample_name, gs.ghs_danger_class, gs.dimensions AS dimensions_enum
      FROM dispensed_samples ds
      JOIN global_samples gs ON ds.global_sample_id = gs.id
      WHERE ds.id = $1 AND ds.shelf_id = $2 AND ds.status = 'stored'
    `, [sample_id, id]);

    if (sampleResult.rows.length === 0) {
      throw new AppError('Muestra no encontrada en este anaquel', 404);
    }

    const sample = sampleResult.rows[0];
    const dims = parseDimensions(sample.dimensions_enum);
    const width = sample.width || dims.width;
    const height = sample.height || dims.height;
    const depth = sample.depth || dims.depth;

    // Verificar que el destino no colisione con otras muestras
    const collision = await query(`
      SELECT id FROM dispensed_samples
      WHERE shelf_id = $1 AND status = 'stored' AND id != $2
        AND position_x < $3 + $4 AND position_x + width > $3
        AND position_y < $5 + $6 AND position_y + height > $5
        AND position_z < $7 + $8 AND position_z + depth > $7
    `, [id, sample_id, to_x, width, to_y, height, finalZ, depth]);

    if (collision.rows.length > 0) {
      throw new AppError(
        `La posición destino (Columna ${to_x + 1}, Nivel ${to_y + 1}, Prof ${finalZ + 1}) está ocupada por otra muestra`,
        409
      );
    }

    // Verificar límites del grid
    const shelf = shelfResult.rows[0];
    if (to_x < 0 || to_y < 0 || finalZ < 0 || to_x + width > shelf.grid_width || to_y + height > shelf.grid_height || finalZ + depth > shelf.shelf_depth) {
      throw new AppError('La posición destino excede los límites del anaquel', 400);
    }

    // Ejecutar movimiento
    await query(`
      UPDATE dispensed_samples
      SET position_x = $1, position_y = $2, position_z = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [to_x, to_y, finalZ, sample_id]);

    // Registrar en movimientos/trazabilidad
    await query(`
      INSERT INTO movements (sample_id, action_type, user_id, details)
      VALUES ($1, $2, $3, $4)
    `, [
      sample_id,
      'moved',
      req.user.id,
      JSON.stringify({
        type: 'defragmentation_move',
        shelf_id: id,
        shelf_name: shelf.name,
        from_position: { x: from_x ?? sample.position_x, y: from_y ?? sample.position_y, z: from_z ?? sample.position_z },
        to_position: { x: to_x, y: to_y, z: finalZ },
        executed_by: req.user.id,
      }),
    ]);

    return res.json({
      success: true,
      message: `Muestra "${sample.global_sample_name}" movida a (Columna ${to_x + 1}, Nivel ${to_y + 1}, Prof ${finalZ + 1})`,
      data: {
        sample_id,
        sample_name: sample.global_sample_name,
        from: { x: from_x ?? sample.position_x, y: from_y ?? sample.position_y, z: from_z ?? sample.position_z },
        to: { x: to_x, y: to_y, z: finalZ },
        dimensions: `${width}x${height}x${depth}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  defragmentShelf,
  confirmDefragMove,
};
