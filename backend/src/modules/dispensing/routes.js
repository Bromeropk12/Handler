const express = require('express');
const { subdivideBulkSample } = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');

const router = express.Router();

// Endpoint para definir unidades y crear QRs
router.post('/subdivide', verifyToken, requireAdmin, subdivideBulkSample);

module.exports = router;