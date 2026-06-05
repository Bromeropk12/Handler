/**
 * Warehouse Controller
 * Controlador principal que importa operaciones de módulos especializados
 */

const {
  createShelf,
  getShelves,
  getShelfById,
  updateShelf,
  deleteShelf
} = require('./shelf-operations');

const {
  getShelfMap,
  placeSample,
  moveSample,
  removeSample,
  autoPlaceSamples
} = require('./map-operations');

const {
  defragmentShelf,
  confirmDefragMove
} = require('./defragment-operations');

const groupOps = require('./group-operations');
const databaseService = require('../../services/database');

// ──────────────────────────────────────────────────────────────────────
//  Drag-en-grupo (N muestras del mismo tipo, movimiento atómico)
// ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/warehouse/:id/preview-move-group
 *
 * Body: { sample_ids: string[], target_shelf_id?: string }
 *
 * Retorna una matriz de celdas candidatas en el shelf destino con
 * `compatible: true|false` para cada una. El frontend usa este cache
 * para pintar los cubos fantasma en verde/rojo durante el drag.
 *
 * Permisos: warehouse.view
 */
exports.previewGroupMove = async (req, res, next) => {
  try {
    const { id: shelfId } = req.params;
    const { sample_ids, target_shelf_id } = req.body;

    if (!Array.isArray(sample_ids) || sample_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array no-vacío de sample_ids',
      });
    }

    const result = await groupOps.previewGroupPlacement({
      shelfId,
      targetShelfId: target_shelf_id || shelfId,
      sampleIds: sample_ids,
      db: databaseService,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/warehouse/:id/move-group
 *
 * Body: { target_shelf_id?: string, moves: [{sample_id, new_position_x, new_position_y, new_position_z}] }
 *
 * Ejecuta el commit atómico del grupo. Si CUALQUIER muestra del grupo
 * no se puede colocar (SGA, colisión, límites, status), se hace
 * ROLLBACK total y se retorna 400.
 *
 * Retorna: { batchId, moved: [...], movements: N }
 *
 * Permisos: warehouse.move_sample
 */
exports.moveGroup = async (req, res, next) => {
  try {
    const { id: shelfId } = req.params;
    const { target_shelf_id, moves } = req.body;

    if (!Array.isArray(moves) || moves.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array no-vacío de moves',
      });
    }

    const result = await groupOps.commitGroupMove({
      sourceShelfId: shelfId,
      targetShelfId: target_shelf_id || shelfId,
      sampleMoves: moves,
      userId: req.user.id,
      db: databaseService,
    });

    res.json({
      success: true,
      message: `${result.moved.length} muestras movidas exitosamente`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createShelf,
  getShelves,
  getShelfById,
  updateShelf,
  deleteShelf,
  getShelfMap,
  placeSample,
  moveSample,
  removeSample,
  autoPlaceSamples,
  defragmentShelf,
  confirmDefragMove,
  previewGroupMove: exports.previewGroupMove,
  moveGroup: exports.moveGroup,
};