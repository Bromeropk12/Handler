const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier, uploadSupplierLogo } = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');

const router = express.Router();

// Configuración de multer para logo de proveedor
const logoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'proveedores');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `supplier_${req.params.id}_${Date.now()}${ext}`;
    cb(null, safeName);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PNG'));
    }
  }
});

router.get('/', verifyToken, requirePermission('suppliers.view'), getSuppliers);
router.post('/', verifyToken, requirePermission('suppliers.create'), createSupplier);
router.put('/:id', verifyToken, requirePermission('suppliers.edit'), updateSupplier);
router.delete('/:id', verifyToken, requirePermission('suppliers.delete'), deleteSupplier);
router.post('/:id/logo', verifyToken, requirePermission('suppliers.edit'), logoUpload.single('logo'), uploadSupplierLogo);

module.exports = router;
