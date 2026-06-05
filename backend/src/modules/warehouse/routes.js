/**
 * Warehouse Routes
 * Rutas para gestión de anaqueles y operaciones del mapa 2D
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');
const {
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
  previewGroupMove,
  moveGroup
} = require('./controller');

router.use(verifyToken);

/**
 * @openapi
 * /api/warehouse:
 *   post:
 *     summary: Crear un nuevo anaquel
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               rows:
 *                 type: integer
 *               columns:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Anaquel creado
 */
router.post('/', requirePermission('warehouse.create_shelf'), createShelf);

/**
 * @openapi
 * /api/warehouse:
 *   get:
 *     summary: Listar anaqueles con filtros
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de anaqueles
 */
router.get('/', requirePermission('warehouse.view'), getShelves);

/**
 * @openapi
 * /api/warehouse/{id}:
 *   get:
 *     summary: Obtener detalle de un anaquel
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del anaquel
 *       404:
 *         description: Anaquel no encontrado
 */
router.get('/:id', requirePermission('warehouse.view'), getShelfById);

/**
 * @openapi
 * /api/warehouse/{id}:
 *   put:
 *     summary: Actualizar un anaquel
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Anaquel actualizado
 */
router.put('/:id', requirePermission('warehouse.edit_shelf'), updateShelf);

/**
 * @openapi
 * /api/warehouse/{id}:
 *   delete:
 *     summary: Eliminar un anaquel
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Anaquel eliminado
 */
router.delete('/:id', requirePermission('warehouse.delete_shelf'), deleteShelf);

/**
 * @openapi
 * /api/warehouse/{id}/map:
 *   get:
 *     summary: Obtener mapa completo del anaquel
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mapa 2D del anaquel
 */
router.get('/:id/map', requirePermission('warehouse.view'), getShelfMap);

/**
 * @openapi
 * /api/warehouse/{id}/place-sample:
 *   post:
 *     summary: Colocar muestra en un anaquel
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sample_id:
 *                 type: integer
 *               row:
 *                 type: integer
 *               col:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Muestra colocada
 */
router.post('/:id/place-sample', requirePermission('warehouse.place_sample'), placeSample);

/**
 * @openapi
 * /api/warehouse/{id}/auto-place:
 *   post:
 *     summary: Auto-colocar múltiples muestras
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sample_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Muestras colocadas automáticamente
 */
router.post('/:id/auto-place', requirePermission('warehouse.place_sample'), autoPlaceSamples);

/**
 * @openapi
 * /api/warehouse/{id}/move-sample:
 *   put:
 *     summary: Mover muestra a otra posición
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sample_id:
 *                 type: integer
 *               new_row:
 *                 type: integer
 *               new_col:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Muestra movida
 */
router.put('/:id/move-sample', requirePermission('warehouse.move_sample'), moveSample);

/**
 * @openapi
 * /api/warehouse/{id}/remove-sample:
 *   delete:
 *     summary: Quitar muestra de un anaquel
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sample_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Muestra removida
 */
router.delete('/:id/remove-sample', requirePermission('warehouse.remove_sample'), removeSample);

/**
 * @openapi
 * /api/warehouse/{id}/defragment:
 *   post:
 *     summary: Calcular plan de desfragmentación
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Plan de desfragmentación
 */
router.post('/:id/defragment', requirePermission('warehouse.defragment'), defragmentShelf);

/**
 * @openapi
 * /api/warehouse/{id}/defragment/confirm:
 *   post:
 *     summary: Confirmar y ejecutar un movimiento de desfragmentación
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from_row:
 *                 type: integer
 *               from_col:
 *                 type: integer
 *               to_row:
 *                 type: integer
 *               to_col:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Movimiento ejecutado
 */
router.post('/:id/defragment/confirm', requirePermission('warehouse.defragment'), confirmDefragMove);

/**
 * @openapi
 * /api/warehouse/{id}/preview-move-group:
 *   post:
 *     summary: Previsualizar movimiento grupal (drag-en-grupo)
 *     description: |
 *       Retorna una matriz de celdas candidatas en el shelf destino con
 *       `compatible: true|false` para cada una, considerando colisiones
 *       AABB y compatibilidad SGA con muestras externas. El frontend
 *       usa este cache para pintar los cubos fantasma en tiempo real.
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sample_ids:
 *                 type: array
 *                 items: { type: string }
 *               target_shelf_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Matriz de celdas válidas/inválidas
 *       400:
 *         description: Grupo con tipos distintos, dimensiones distintas, o múltiples anaqueles
 *       404:
 *         description: Alguna muestra o anaquel no encontrado
 */
router.post(
  '/:id/preview-move-group',
  requirePermission('warehouse.view'),
  previewGroupMove
);

/**
 * @openapi
 * /api/warehouse/{id}/move-group:
 *   post:
 *     summary: Mover grupo de muestras (commit atómico)
 *     description: |
 *       Mueve N muestras del mismo tipo en una sola transacción.
 *       Si CUALQUIER muestra falla, se hace ROLLBACK total.
 *       Las entradas de `movements` comparten el mismo `batch_id`.
 *     tags: [Warehouse]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               target_shelf_id:
 *                 type: string
 *               moves:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     sample_id: { type: string }
 *                     new_position_x: { type: integer }
 *                     new_position_y: { type: integer }
 *                     new_position_z: { type: integer }
 *     responses:
 *       200:
 *         description: Grupo movido atómicamente
 *       400:
 *         description: Validación fallida (SGA, colisión, límites)
 *       404:
 *         description: Muestra no encontrada
 *       409:
 *         description: Muestra cambió de estado/posición durante el commit
 */
router.post(
  '/:id/move-group',
  requirePermission('warehouse.move_sample'),
  moveGroup
);

module.exports = router;
