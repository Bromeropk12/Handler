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

const { runCronJob, getSettings, updateSettings } = require('./controller');

/**
 * @openapi
 * /api/backup/cron:
 *   get:
 *     summary: Ejecutar backup programado (cron)
 *     tags: [Backup]
 *     responses:
 *       200:
 *         description: Backup ejecutado
 */
router.get('/cron', runCronJob);

router.use(verifyToken, requireAdmin);

/**
 * @openapi
 * /api/backup/settings:
 *   get:
 *     summary: Obtener configuración de backups
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración de backups
 */
router.route('/settings')
  .get(getSettings)
/**
 * @openapi
 * /api/backup/settings:
 *   put:
 *     summary: Actualizar configuración de backups
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interval:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Configuración actualizada
 */
  .put(updateSettings);

/**
 * @openapi
 * /api/backup/status:
 *   get:
 *     summary: Estado general del sistema de backups
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del sistema
 */
router.get('/status', getBackupStatus);

/**
 * @openapi
 * /api/backup/list:
 *   get:
 *     summary: Listar todos los backups disponibles
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de backups
 */
router.get('/list', listBackups);

/**
 * @openapi
 * /api/backup/create:
 *   post:
 *     summary: Crear backup manual
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Backup creado
 */
router.post('/create', createBackup);

/**
 * @openapi
 * /api/backup/restore:
 *   post:
 *     summary: Restaurar un backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               admin_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Backup restaurado
 */
router.post('/restore', restoreBackup);

/**
 * @openapi
 * /api/backup/{filename}:
 *   delete:
 *     summary: Eliminar un backup específico
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backup eliminado
 */
router.delete('/:filename', deleteBackup);

/**
 * @openapi
 * /api/backup/sync-onedrive:
 *   post:
 *     summary: Sincronizar backups con OneDrive
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sincronización iniciada
 */
router.post('/sync-onedrive', syncToOneDrive);

module.exports = router;
