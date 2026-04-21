const express = require('express');
const { subdivideBulkSample, getDispensedSamples, getUnplacedSamples, reassignShelf } = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');

const router = express.Router();

/**
 * POST /api/dispensing/subdivide
 * Subdividir un Bulk Sample en Muestras Hijas con ubicación SGA automática
 * Solo admin puede realizar esta acción
 */
router.post('/subdivide', verifyToken, requireAdmin, subdivideBulkSample);

/**
 * PUT /api/dispensing/reassign-shelf
 * Reasignar todas las muestras hijas de un bulk a un anaquel diferente
 */
router.put('/reassign-shelf', verifyToken, requireAdmin, reassignShelf);

/**
 * GET /api/dispensing
 * Obtener muestras dispensadas con filtros opcionales
 */
router.get('/', verifyToken, getDispensedSamples);

/**
 * GET /api/dispensing/unplaced
 * Obtener muestras pendientes por ubicar (sin anaquel)
 */
router.get('/unplaced', verifyToken, getUnplacedSamples);

module.exports = router;