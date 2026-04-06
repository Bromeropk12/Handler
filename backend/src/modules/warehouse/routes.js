/**
 * Warehouse Routes
 * Rutas para gestión de anaqueles y operaciones del mapa 2D
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
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
  autoPlaceSamples
} = require('./controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// CRUD de Anaqueles
router.post('/', authorize('admin'), createShelf);           // Crear anaquel
router.get('/', getShelves);                                  // Listar anaqueles con filtros
router.get('/:id', getShelfById);                             // Detalle de anaquel
router.put('/:id', authorize('admin'), updateShelf);         // Actualizar anaquel
router.delete('/:id', authorize('admin'), deleteShelf);      // Eliminar anaquel

// Operaciones del Mapa 2D
router.get('/:id/map', getShelfMap);                          // Obtener mapa completo
router.post('/:id/place-sample', authorize('operator'), placeSample);    // Colocar muestra
router.post('/:id/auto-place', authorize('admin'), autoPlaceSamples);    // Auto-colocar múltiples
router.put('/:id/move-sample', authorize('operator'), moveSample);       // Mover muestra
router.delete('/:id/remove-sample', authorize('operator'), removeSample); // Quitar muestra

module.exports = router;