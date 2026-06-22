/**
 * Backup Routes
 * Todas las rutas de backup requieren autenticación y rol de administrador
 */

const express = require('express');
const multer = require('multer');
const {
  listBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  syncToOneDrive,
  importBackup,
  downloadBackup,
  getBackupStatus,
  getLocalPath,
  setLocalPath,
} = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');

const router = express.Router();

const { runCronJob, getSettings, updateSettings } = require('./controller');

// multer configurado en memoria: el archivo .json del cliente no se escribe a disco
// del servidor hasta que el handler importBackup haya validado contrasena y estructura.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.toLowerCase().endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos .json'), false);
    }
  },
});

router.use(verifyToken, requireAdmin);

/**
 * @openapi
 * /api/backup/cron:
 *   get:
 *     summary: Ejecutar backup programado (cron) — solo admin
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup ejecutado
 *       401:
 *         description: Token requerido
 *       403:
 *         description: Se requiere rol de administrador
 */
router.get('/cron', runCronJob);

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
  .put(updateSettings);

router.route('/local-path')
  .get(getLocalPath)
  .put(setLocalPath);

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
 *     summary: Sincronizar backups locales con OneDrive
 *     description: Copia los backups que existen en LOCAL_BACKUP_DIR pero no en OneDrive. Si OneDrive no está disponible, devuelve success:false sin error.
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado de la sincronización
 */
router.post('/sync-onedrive', syncToOneDrive);

/**
 * @openapi
 * /api/backup/import:
 *   post:
 *     summary: Importar un backup desde un archivo .json del cliente
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               backup:
 *                 type: string
 *                 format: binary
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Backup importado
 *       400:
 *         description: Archivo inválido, sin password, o version incompatible
 *       401:
 *         description: Contraseña incorrecta
 */
router.post('/import', upload.single('backup'), importBackup);

/**
 * @openapi
 * /api/backup/download/{filename}:
 *   get:
 *     summary: Descargar un backup como archivo .json
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
 *         description: Archivo JSON del backup
 *       404:
 *         description: Backup no encontrado
 */
router.get('/download/:filename', downloadBackup);

module.exports = router;
