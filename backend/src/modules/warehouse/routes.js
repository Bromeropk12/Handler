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
  confirmDefragMove
} = require('./controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// CRUD de Anaqueles
router.post('/', requirePermission('warehouse.create_shelf'), createShelf);           // Crear anaquel
router.get('/', requirePermission('warehouse.view'), getShelves);                                  // Listar anaqueles con filtros
router.get('/:id', requirePermission('warehouse.view'), getShelfById);                             // Detalle de anaquel
router.put('/:id', requirePermission('warehouse.edit_shelf'), updateShelf);         // Actualizar anaquel
router.delete('/:id', requirePermission('warehouse.delete_shelf'), deleteShelf);      // Eliminar anaquel

// Operaciones del Mapa 2D
router.get('/:id/map', requirePermission('warehouse.view'), getShelfMap);                          // Obtener mapa completo
router.post('/:id/place-sample', requirePermission('warehouse.place_sample'), placeSample);    // Colocar muestra
router.post('/:id/auto-place', requirePermission('warehouse.place_sample'), autoPlaceSamples);    // Auto-colocar múltiples
router.put('/:id/move-sample', requirePermission('warehouse.move_sample'), moveSample);       // Mover muestra
router.delete('/:id/remove-sample', requirePermission('warehouse.remove_sample'), removeSample); // Quitar muestra

// Desfragmentación
router.post('/:id/defragment', requirePermission('warehouse.defragment'), defragmentShelf);              // Calcular plan de desfragmentación
router.post('/:id/defragment/confirm', requirePermission('warehouse.defragment'), confirmDefragMove);    // Confirmar y ejecutar un movimiento

module.exports = router;