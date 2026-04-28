/**
 * Backup Routes
 * Todas las rutas de backup requieren autenticación y rol de administrador
 */

const express = require('express');
const {
  listBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  syncToOneDrive,
  getBackupStatus,
} = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');

const router = express.Router();

// Todas las rutas de backup requieren token + rol admin
router.use(verifyToken, requireAdmin);

/**
 * GET /api/backup/status
 * Estado general del sistema de backups
 */
router.get('/status', getBackupStatus);

/**
 * GET /api/backup/list
 * Listar todos los backups disponibles
 */
router.get('/list', listBackups);

/**
 * POST /api/backup/create
 * Crear backup manual
 */
router.post('/create', createBackup);

/**
 * POST /api/backup/restore
 * Restaurar un backup (requiere contraseña admin)
 */
router.post('/restore', restoreBackup);

/**
 * DELETE /api/backup/:filename
 * Eliminar un backup específico
 */
router.delete('/:filename', deleteBackup);

/**
 * POST /api/backup/sync-onedrive
 * Sincronizar backups con OneDrive
 */
router.post('/sync-onedrive', syncToOneDrive);

module.exports = router;
