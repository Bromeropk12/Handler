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

router.use(verifyToken);

/**
 * @openapi
 * /api/shelf-suppliers/shelf/{shelfId}:
 *   get:
 *     summary: Obtener proveedores de un anaquel
 *     tags: [Shelf Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shelfId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del anaquel
 *     responses:
 *       200:
 *         description: Proveedores del anaquel
 */
router.get('/shelf/:shelfId', requirePermission('warehouse.view'), getShelfSuppliers);

/**
 * @openapi
 * /api/shelf-suppliers:
 *   post:
 *     summary: Vincular proveedor a anaquel
 *     tags: [Shelf Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shelf_id:
 *                 type: integer
 *               supplier_id:
 *                 type: integer
 *               is_primary:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Proveedor vinculado
 */
router.post('/', requirePermission('warehouse.edit_shelf'), addShelfSupplier);

/**
 * @openapi
 * /api/shelf-suppliers/{id}:
 *   put:
 *     summary: Actualizar proveedor principal de un anaquel
 *     tags: [Shelf Suppliers]
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
 *               is_primary:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Relación actualizada
 */
router.put('/:id', requirePermission('warehouse.edit_shelf'), updateShelfSupplier);

/**
 * @openapi
 * /api/shelf-suppliers/{id}:
 *   delete:
 *     summary: Desvincular proveedor de anaquel
 *     tags: [Shelf Suppliers]
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
 *         description: Proveedor desvinculado
 */
router.delete('/:id', requirePermission('warehouse.edit_shelf'), removeShelfSupplier);

module.exports = router;
