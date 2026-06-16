const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const {
  createBulkSample,
  getBulkSamples,
  getBulkSampleById,
  updateBulkSample,
  deleteBulkSample,
  getMarketLines,
  getSuppliers,
  downloadCoA,
} = require('./controller');
const { verifyToken } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');

const router = express.Router();

// Multer and magic number validation removed as we no longer upload CoA files internally

/**
 * @openapi
 * /api/samples:
 *   get:
 *     summary: Listar muestras globales con filtros
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: market_line_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: supplier_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de muestras globales
 */
router.get('/', verifyToken, requirePermission('samples.view'), getBulkSamples);

/**
 * @openapi
 * /api/samples/market-lines:
 *   get:
 *     summary: Obtener líneas de mercado disponibles
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Líneas de mercado
 */
router.get('/market-lines', verifyToken, requirePermission('samples.view'), getMarketLines);

/**
 * @openapi
 * /api/samples/suppliers:
 *   get:
 *     summary: Obtener proveedores disponibles
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Proveedores
 */
router.get('/suppliers', verifyToken, requirePermission('samples.view'), getSuppliers);

/**
 * @openapi
 * /api/samples/{id}:
 *   get:
 *     summary: Obtener muestra global por ID
 *     tags: [Samples]
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
 *         description: Muestra global
 *       404:
 *         description: No encontrada
 */
router.get('/:id', verifyToken, requirePermission('samples.view'), getBulkSampleById);

/**
 * @openapi
 * /api/samples/{id}/coa:
 *   get:
 *     summary: Descargar/Ver certificado CoA asociado a la muestra
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Archivo PDF
 *       404:
 *         description: Archivo no encontrado
 */
router.get('/:id/coa', verifyToken, downloadCoA);

/**
 * @openapi
 * /api/samples:
 *   post:
 *     summary: Crear nueva muestra global con CoA opcional
 *     tags: [Samples]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *               market_line_id:
 *                 type: integer
 *               supplier_id:
 *                 type: integer
 *               coa_file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Muestra creada
 */
router.post('/', verifyToken, requirePermission('samples.create'), createBulkSample);

/**
 * @openapi
 * /api/samples/{id}:
 *   put:
 *     summary: Actualizar muestra global
 *     tags: [Samples]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *               market_line_id:
 *                 type: integer
 *               supplier_id:
 *                 type: integer
 *               coa_file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Muestra actualizada
 */
router.put('/:id', verifyToken, requirePermission('samples.edit'), updateBulkSample);

/**
 * @openapi
 * /api/samples/{id}:
 *   delete:
 *     summary: Eliminar muestra global
 *     tags: [Samples]
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
 *         description: Muestra eliminada
 */
router.delete('/:id', verifyToken, requirePermission('samples.delete'), deleteBulkSample);

module.exports = router;
