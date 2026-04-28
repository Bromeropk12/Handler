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

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * GET /api/alerts/expired
 * Obtener productos vencidos
 */
router.get('/expired', requirePermission('alerts.view'), getExpiredAlerts);

/**
 * GET /api/alerts/expiring?days=30
 * Obtener productos por vencer
 */
router.get('/expiring', requirePermission('alerts.view'), getExpiringAlerts);

/**
 * GET /api/alerts/summary
 * Resumen combinado de todas las alertas
 */
router.get('/summary', requirePermission('alerts.view'), getAlertsSummary);

module.exports = router;