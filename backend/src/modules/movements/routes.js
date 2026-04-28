/**
 * Movements Routes
 * Rutas para trazabilidad de movimientos
 */

const express = require('express');
const { asyncErrorHandler } = require('../../middleware/errorHandler');
const {
  getMovements,
  getMovementTypes,
  getMovementsSummary
} = require('./controller');

const router = express.Router();

/**
 * GET /api/movements
 * Obtener historial de movimientos con filtros y paginación
 * Query params:
 * - action_type: Filtrar por tipo de movimiento
 * - start_date: Fecha de inicio (YYYY-MM-DD)
 * - end_date: Fecha de fin (YYYY-MM-DD)
 * - sample_id: Filtrar por ID de muestra
 * - user_id: Filtrar por ID de usuario
 * - page: Número de página (default: 1)
 * - limit: Elementos por página (default: 50)
 * - export_csv: Exportar como CSV (true/false)
 */
router.get('/', asyncErrorHandler(getMovements));

/**
 * GET /api/movements/types
 * Obtener tipos de movimientos disponibles
 */
router.get('/types', asyncErrorHandler(getMovementTypes));

/**
 * GET /api/movements/summary
 * Obtener resumen de movimientos
 * Query params:
 * - start_date: Fecha de inicio (YYYY-MM-DD)
 * - end_date: Fecha de fin (YYYY-MM-DD)
 */
router.get('/summary', asyncErrorHandler(getMovementsSummary));

module.exports = router;