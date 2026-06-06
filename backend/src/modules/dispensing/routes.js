const express = require('express');
const { subdivideBulkSample, getDispensedSamples, getUnplacedSamples, reassignShelf } = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');
const { validate, schemas } = require('../../middleware/validate');

const router = express.Router();

/**
 * @openapi
 * /api/dispensing/subdivide:
 *   post:
 *     summary: Subdividir un Bulk Sample en muestras hijas
 *     tags: [Dispensing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bulk_sample_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Muestras subdivididas exitosamente
 */
router.post('/subdivide', verifyToken, requirePermission('dispensing.create'), validate(schemas.dispensingSubdivide), subdivideBulkSample);

/**
 * @openapi
 * /api/dispensing/reassign-shelf:
 *   put:
 *     summary: Reasignar muestras hijas a un anaquel diferente
 *     tags: [Dispensing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bulk_sample_id:
 *                 type: integer
 *               new_shelf_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Anaquel reasignado
 */
router.put('/reassign-shelf', verifyToken, requirePermission('dispensing.reassign'), reassignShelf);

/**
 * @openapi
 * /api/dispensing:
 *   get:
 *     summary: Obtener muestras dispensadas
 *     tags: [Dispensing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: bulk_sample_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: shelf_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de muestras dispensadas
 */
router.get('/', verifyToken, requirePermission('dispensing.view'), getDispensedSamples);

/**
 * @openapi
 * /api/dispensing/unplaced:
 *   get:
 *     summary: Obtener muestras sin ubicar
 *     tags: [Dispensing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de muestras sin anaquel
 */
router.get('/unplaced', verifyToken, requirePermission('dispensing.view'), getUnplacedSamples);

module.exports = router;
