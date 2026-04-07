/**
 * Market Lines Routes
 * CRUD completo para líneas de negocio/mercado
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');
const {
  getMarketLines,
  getMarketLineById,
  createMarketLine,
  updateMarketLine,
  deleteMarketLine
} = require('./controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /api/market-lines
 * Listar todas las líneas de mercado
 */
router.get('/', getMarketLines);

/**
 * GET /api/market-lines/:id
 * Obtener línea de mercado por ID
 */
router.get('/:id', getMarketLineById);

/**
 * POST /api/market-lines
 * Crear nueva línea de mercado (solo admin)
 */
router.post('/', authorize('admin'), createMarketLine);

/**
 * PUT /api/market-lines/:id
 * Actualizar línea de mercado (solo admin)
 */
router.put('/:id', authorize('admin'), updateMarketLine);

/**
 * DELETE /api/market-lines/:id
 * Eliminar línea de mercado (solo admin)
 */
router.delete('/:id', authorize('admin'), deleteMarketLine);

module.exports = router;