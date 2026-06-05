const express = require('express');
const { getFefoRecommendation, executeDispatch, getDispatchHistory } = require('./controller');
const { verifyToken } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');

const router = express.Router();

/**
 * @openapi
 * /api/dispatch/fefo:
 *   get:
 *     summary: Obtener recomendación FEFO para despacho
 *     tags: [Dispatch]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: product
 *         schema:
 *           type: string
 *         description: Nombre del producto a buscar
 *       - in: query
 *         name: market_line_id
 *         schema:
 *           type: integer
 *         description: ID de línea de mercado
 *     responses:
 *       200:
 *         description: Recomendación FEFO
 */
router.get('/fefo', verifyToken, requirePermission('dispatch.fefo'), getFefoRecommendation);

/**
 * @openapi
 * /api/dispatch/execute:
 *   post:
 *     summary: Ejecutar un despacho
 *     tags: [Dispatch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sample_id:
 *                 type: integer
 *               destination:
 *                 type: string
 *     responses:
 *       200:
 *         description: Despacho ejecutado
 */
router.post('/execute', verifyToken, requirePermission('dispatch.execute'), executeDispatch);

/**
 * @openapi
 * /api/dispatch/history:
 *   get:
 *     summary: Obtener historial de despachos
 *     tags: [Dispatch]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de despachos
 */
router.get('/history', verifyToken, requirePermission('dispatch.view'), getDispatchHistory);

module.exports = router;
