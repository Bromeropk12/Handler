const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier, uploadSupplierLogo } = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');
const { requirePermission } = require('../../middleware/permissions');

const router = express.Router();

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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PNG'));
    }
  }
});

/**
 * @openapi
 * /api/suppliers:
 *   get:
 *     summary: Listar proveedores
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proveedores
 */
router.get('/', verifyToken, requirePermission('suppliers.view'), getSuppliers);

/**
 * @openapi
 * /api/suppliers:
 *   post:
 *     summary: Crear nuevo proveedor
 *     tags: [Suppliers]
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
 *               contact:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proveedor creado
 */
router.post('/', verifyToken, requirePermission('suppliers.create'), createSupplier);

/**
 * @openapi
 * /api/suppliers/{id}:
 *   put:
 *     summary: Actualizar proveedor
 *     tags: [Suppliers]
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
 *               contact:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proveedor actualizado
 */
router.put('/:id', verifyToken, requirePermission('suppliers.edit'), updateSupplier);

/**
 * @openapi
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Eliminar proveedor
 *     tags: [Suppliers]
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
 *         description: Proveedor eliminado
 */
router.delete('/:id', verifyToken, requirePermission('suppliers.delete'), deleteSupplier);

/**
 * @openapi
 * /api/suppliers/{id}/logo:
 *   post:
 *     summary: Subir logo de proveedor (PNG)
 *     tags: [Suppliers]
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
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo subido
 */
router.post('/:id/logo', verifyToken, requirePermission('suppliers.edit'), logoUpload.single('logo'), uploadSupplierLogo);

module.exports = router;
