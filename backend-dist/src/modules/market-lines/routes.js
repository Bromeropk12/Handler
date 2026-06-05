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

router.use(verifyToken);

/**
 * @openapi
 * /api/market-lines:
 *   get:
 *     summary: Listar todas las líneas de mercado
 *     tags: [Market Lines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de líneas de mercado
 */
router.get('/', requirePermission('market_lines.view'), getMarketLines);

/**
 * @openapi
 * /api/market-lines/{id}:
 *   get:
 *     summary: Obtener línea de mercado por ID
 *     tags: [Market Lines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Línea de mercado
 *       404:
 *         description: No encontrada
 */
router.get('/:id', requirePermission('market_lines.view'), getMarketLineById);

/**
 * @openapi
 * /api/market-lines:
 *   post:
 *     summary: Crear nueva línea de mercado
 *     tags: [Market Lines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Línea de mercado creada
 */
router.post('/', requirePermission('market_lines.create'), createMarketLine);

/**
 * @openapi
 * /api/market-lines/{id}:
 *   put:
 *     summary: Actualizar línea de mercado
 *     tags: [Market Lines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Línea de mercado actualizada
 */
router.put('/:id', requirePermission('market_lines.edit'), updateMarketLine);

/**
 * @openapi
 * /api/market-lines/{id}:
 *   delete:
 *     summary: Eliminar línea de mercado
 *     tags: [Market Lines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Línea de mercado eliminada
 */
router.delete('/:id', requirePermission('market_lines.delete'), deleteMarketLine);

module.exports = router;
