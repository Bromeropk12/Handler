/**
 * Alerts Routes
 * Rutas para gestión de alertas de vencimiento
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const {
  getExpiredAlerts,
  getExpiringAlerts,
  getAlertsSummary
} = require('./controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /api/alerts/expired
 * Obtener productos vencidos
 */
router.get('/expired', getExpiredAlerts);

/**
 * GET /api/alerts/expiring?days=30
 * Obtener productos por vencer
 */
router.get('/expiring', getExpiringAlerts);

/**
 * GET /api/alerts/summary
 * Resumen combinado de todas las alertas
 */
router.get('/summary', getAlertsSummary);

module.exports = router;