/**
 * Shelf Suppliers Routes
 * Gestión de relación many-to-many entre anaqueles y proveedores
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');
const {
  getShelfSuppliers,
  addShelfSupplier,
  updateShelfSupplier,
  removeShelfSupplier
} = require('./controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * GET /api/shelf-suppliers/shelf/:shelfId
 * Obtener proveedores de un anaquel
 */
router.get('/shelf/:shelfId', requirePermission('warehouse.view'), getShelfSuppliers);

/**
 * POST /api/shelf-suppliers
 * Vincular proveedor a anaquel (solo admin)
 */
router.post('/', requirePermission('warehouse.edit_shelf'), addShelfSupplier);

/**
 * PUT /api/shelf-suppliers/:id
 * Actualizar proveedor principal (solo admin)
 */
router.put('/:id', requirePermission('warehouse.edit_shelf'), updateShelfSupplier);

/**
 * DELETE /api/shelf-suppliers/:id
 * Desvincular proveedor de anaquel (solo admin)
 */
router.delete('/:id', requirePermission('warehouse.edit_shelf'), removeShelfSupplier);

module.exports = router;