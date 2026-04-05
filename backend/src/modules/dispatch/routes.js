const express = require('express');
const { getFefoRecommendation, executeDispatch, getDispatchHistory } = require('./controller');
const { verifyToken } = require('../auth/controller');

const router = express.Router();

// Todos los usuarios autenticados pueden buscar recomendaciones FEFO
router.get('/fefo', verifyToken, getFefoRecommendation);

// Todos los usuarios autenticados pueden ejecutar despachos
// (La validación del producto escaneado vs esperado actúa como control de seguridad)
router.post('/execute', verifyToken, executeDispatch);

// Historial de despachos ejecutados
router.get('/history', verifyToken, getDispatchHistory);

module.exports = router;