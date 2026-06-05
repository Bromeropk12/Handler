/**
 * Movements Routes
 * Rutas para trazabilidad de movimientos
 */

const express = require('express');
const { asyncErrorHandler } = require('../../middleware/errorHandler');
const { getMovements, getMovementTypes, getMovementsSummary } = require('./controller');
const { verifyToken } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');

const router = express.Router();

router.use(verifyToken);

/**
 * @openapi
 * /api/movements:
 *   get:
 *     summary: Obtener historial de movimientos
 *     tags: [Movements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de movimiento
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *       - in: query
 *         name: sample_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de muestra
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de usuario
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: export_csv
 *         schema:
 *           type: boolean
 *         description: Exportar como CSV
 *     responses:
 *       200:
 *         description: Historial de movimientos
 */
router.get('/', requirePermission('movements.view'), asyncErrorHandler(getMovements));

/**
 * @openapi
 * /api/movements/types:
 *   get:
 *     summary: Obtener tipos de movimientos disponibles
 *     tags: [Movements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tipos de movimientos
 */
router.get('/types', requirePermission('movements.view'), asyncErrorHandler(getMovementTypes));

/**
 * @openapi
 * /api/movements/summary:
 *   get:
 *     summary: Obtener resumen de movimientos
 *     tags: [Movements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Resumen de movimientos
 */
router.get('/summary', requirePermission('movements.view'), asyncErrorHandler(getMovementsSummary));

module.exports = router;
