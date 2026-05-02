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

// Rutas públicas / cron (Protegidas por Vercel Cron Secret)
const { runCronJob, getSettings, updateSettings } = require('./controller');
router.get('/cron', runCronJob);

// Todas las demás rutas de backup requieren token + rol admin
router.use(verifyToken, requireAdmin);

/**
 * GET /api/backup/settings
 * PUT /api/backup/settings
 */
router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

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
