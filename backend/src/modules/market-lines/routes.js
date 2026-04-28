/**
 * Market Lines Routes
 * CRUD completo para líneas de negocio/mercado
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');
const {
  getMarketLines,
  getMarketLineById,
  createMarketLine,
  updateMarketLine,
  deleteMarketLine
} = require('./controller');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

/**
 * GET /api/market-lines
 * Listar todas las líneas de mercado
 */
router.get('/', requirePermission('market_lines.view'), getMarketLines);

/**
 * GET /api/market-lines/:id
 * Obtener línea de mercado por ID
 */
router.get('/:id', requirePermission('market_lines.view'), getMarketLineById);

/**
 * POST /api/market-lines
 * Crear nueva línea de mercado (solo admin)
 */
router.post('/', requirePermission('market_lines.create'), createMarketLine);

/**
 * PUT /api/market-lines/:id
 * Actualizar línea de mercado (solo admin)
 */
router.put('/:id', requirePermission('market_lines.edit'), updateMarketLine);

/**
 * DELETE /api/market-lines/:id
 * Eliminar línea de mercado (solo admin)
 */
router.delete('/:id', requirePermission('market_lines.delete'), deleteMarketLine);

module.exports = router;