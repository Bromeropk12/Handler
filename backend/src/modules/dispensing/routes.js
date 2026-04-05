const express = require('express');
const { subdivideBulkSample, getDispensedSamples } = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');

const router = express.Router();

/**
 * POST /api/dispensing/subdivide
 * Subdividir un Bulk Sample en Muestras Hijas
 * Solo admin puede realizar esta acción
 */
router.post('/subdivide', verifyToken, requireAdmin, subdivideBulkSample);

/**
 * GET /api/dispensing
 * Obtener muestras dispensadas con filtros opcionales
 */
router.get('/', verifyToken, getDispensedSamples);

module.exports = router;