/**
 * Samples Routes
 * Rutas para gestión de muestras globales (bulk)
 */

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
} = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');

const router = express.Router();

// Configuración de multer para upload de CoA
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Nombre temporal, se renombrará después de validaciones
    const uniqueName = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

/**
 * GET /api/samples
 * Listar muestras globales con filtros
 */
router.get('/', verifyToken, requirePermission('samples.view'), getBulkSamples);

/**
 * GET /api/samples/market-lines
 * Obtener líneas de mercado disponibles
 */
router.get('/market-lines', verifyToken, requirePermission('samples.view'), getMarketLines);

/**
 * GET /api/samples/suppliers
 * Obtener proveedores disponibles
 */
router.get('/suppliers', verifyToken, requirePermission('samples.view'), getSuppliers);

/**
 * GET /api/samples/:id
 * Obtener muestra global por ID
 */
router.get('/:id', verifyToken, requirePermission('samples.view'), getBulkSampleById);

/**
 * POST /api/samples
 * Crear nueva muestra global con upload opcional de CoA
 */
router.post('/', verifyToken, requirePermission('samples.create'), upload.single('coa_file'), createBulkSample);

/**
 * PUT /api/samples/:id
 * Actualizar muestra global
 */
router.put('/:id', verifyToken, requirePermission('samples.edit'), upload.single('coa_file'), updateBulkSample);

/**
 * DELETE /api/samples/:id
 * Eliminar muestra global
 */
router.delete('/:id', verifyToken, requirePermission('samples.delete'), deleteBulkSample);

module.exports = router;