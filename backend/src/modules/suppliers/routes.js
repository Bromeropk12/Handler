const express = require('express');
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');

const router = express.Router();

router.get('/', verifyToken, getSuppliers);
router.post('/', verifyToken, requireAdmin, createSupplier);
router.put('/:id', verifyToken, requireAdmin, updateSupplier);
router.delete('/:id', verifyToken, requireAdmin, deleteSupplier);

module.exports = router;
