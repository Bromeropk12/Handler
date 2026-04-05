/**
 * Movements Routes
 * Rutas para trazabilidad de movimientos
 */

const express = require('express');
const { asyncErrorHandler } = require('../../middleware/errorHandler');

const router = express.Router();

// TODO: Implementar controladores

/**
 * GET /api/movements
 * Obtener historial de movimientos
 */
router.get('/', asyncErrorHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Movements endpoint - TODO: implementar',
    data: []
  });
}));

module.exports = router;