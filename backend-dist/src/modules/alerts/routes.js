/**
 * Alerts Routes
 * Rutas para gestión de alertas de vencimiento
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');
const {
  getExpiredAlerts,
  getExpiringAlerts,
  getAlertsSummary
} = require('./controller');

router.use(verifyToken);

/**
 * @openapi
 * /api/alerts/expired:
 *   get:
 *     summary: Obtener productos vencidos
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos vencidos
 */
router.get('/expired', requirePermission('alerts.view'), getExpiredAlerts);

/**
 * @openapi
 * /api/alerts/expiring:
 *   get:
 *     summary: Obtener productos por vencer
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Días para considerar próximo vencimiento
 *     responses:
 *       200:
 *         description: Lista de productos por vencer
 */
router.get('/expiring', requirePermission('alerts.view'), getExpiringAlerts);

/**
 * @openapi
 * /api/alerts/summary:
 *   get:
 *     summary: Resumen combinado de alertas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen de alertas
 */
router.get('/summary', requirePermission('alerts.view'), getAlertsSummary);

module.exports = router;
