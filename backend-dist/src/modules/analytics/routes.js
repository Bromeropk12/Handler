const express = require('express');
const { getDashboardStats } = require('./controller');
const { verifyToken } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');

const router = express.Router();

/**
 * @openapi
 * /api/analytics/dashboard:
 *   get:
 *     summary: Obtener estadísticas del dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del dashboard
 */
router.get('/dashboard', verifyToken, requirePermission('dashboard.view'), getDashboardStats);

module.exports = router;
