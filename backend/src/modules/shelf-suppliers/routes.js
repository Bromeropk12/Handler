/**
 * Shelf Suppliers Routes
 * Gestión de relación many-to-many entre anaqueles y proveedores
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const {
  getShelfSuppliers,
  addShelfSupplier,
  updateShelfSupplier,
  removeShelfSupplier
} = require('./controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /api/shelf-suppliers/shelf/:shelfId
 * Obtener proveedores de un anaquel
 */
router.get('/shelf/:shelfId', getShelfSuppliers);

/**
 * POST /api/shelf-suppliers
 * Vincular proveedor a anaquel (solo admin)
 */
router.post('/', authorize('admin'), addShelfSupplier);

/**
 * PUT /api/shelf-suppliers/:id
 * Actualizar proveedor principal (solo admin)
 */
router.put('/:id', authorize('admin'), updateShelfSupplier);

/**
 * DELETE /api/shelf-suppliers/:id
 * Desvincular proveedor de anaquel (solo admin)
 */
router.delete('/:id', authorize('admin'), removeShelfSupplier);

module.exports = router;