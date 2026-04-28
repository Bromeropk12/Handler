const express = require('express');
const { subdivideBulkSample, getDispensedSamples, getUnplacedSamples, reassignShelf } = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');

const router = express.Router();

/**
 * POST /api/dispensing/subdivide
 * Subdividir un Bulk Sample en Muestras Hijas con ubicación SGA automática
 * Solo admin puede realizar esta acción
 */
router.post('/subdivide', verifyToken, requirePermission('dispensing.create'), subdivideBulkSample);

/**
 * PUT /api/dispensing/reassign-shelf
 * Reasignar todas las muestras hijas de un bulk a un anaquel diferente
 */
router.put('/reassign-shelf', verifyToken, requirePermission('dispensing.reassign'), reassignShelf);

/**
 * GET /api/dispensing
 * Obtener muestras dispensadas con filtros opcionales
 */
router.get('/', verifyToken, requirePermission('dispensing.view'), getDispensedSamples);

/**
 * GET /api/dispensing/unplaced
 * Obtener muestras pendientes por ubicar (sin anaquel)
 */
router.get('/unplaced', verifyToken, requirePermission('dispensing.view'), getUnplacedSamples);

module.exports = router;