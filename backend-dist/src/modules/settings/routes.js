/**
 * Settings Routes
 * Todas las rutas requieren autenticación y rol de administrador
 */

const express = require('express');
const { listSettings, getSetting, updateSetting } = require('./controller');
const { verifyToken, requireAdmin } = require('../auth/controller');

const router = express.Router();

router.use(verifyToken, requireAdmin);

/**
 * @openapi
 * /api/settings:
 *   get:
 *     summary: Listar todas las configuraciones del sistema
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de configuraciones
 */
router.get('/', listSettings);

/**
 * @openapi
 * /api/settings/{key}:
 *   get:
 *     summary: Obtener valor de una configuración
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Clave de configuración
 *     responses:
 *       200:
 *         description: Valor de la configuración
 *       404:
 *         description: Clave no encontrada
 */
router.get('/:key', getSetting);

/**
 * @openapi
 * /api/settings/{key}:
 *   put:
 *     summary: Actualizar valor de una configuración
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Clave de configuración
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuración actualizada
 */
router.put('/:key', updateSetting);

module.exports = router;
