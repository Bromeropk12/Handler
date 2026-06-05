const express = require('express');
const {
  login, resetPassword, getCurrentUser, verifyToken, changePassword,
  changeUsername, listUsers, createUser, changeUserPassword, deleteUser,
  requireAdmin, getUserPermissions, updateUserPermissions, setUserPermissions,
  getPermissionDefinitions,
} = require('./controller');

const router = express.Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve token JWT
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña usando contraseña secreta
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               secret_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *       403:
 *         description: Contraseña secreta incorrecta
 */
router.post('/reset-password', resetPassword);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 */
router.get('/me', verifyToken, getCurrentUser);

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     summary: Cambiar contraseña del usuario actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña cambiada
 */
router.post('/change-password', verifyToken, changePassword);

/**
 * @openapi
 * /api/auth/change-username:
 *   put:
 *     summary: Cambiar nombre de usuario (solo admin)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               new_username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nombre de usuario cambiado
 */
router.put('/change-username', verifyToken, requireAdmin, changeUsername);

/**
 * @openapi
 * /api/auth/users:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/users', verifyToken, requireAdmin, listUsers);

/**
 * @openapi
 * /api/auth/users:
 *   post:
 *     summary: Crear nuevo usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *     responses:
 *       201:
 *         description: Usuario creado
 */
router.post('/users', verifyToken, requireAdmin, createUser);

/**
 * @openapi
 * /api/auth/users/{userId}/password:
 *   put:
 *     summary: Cambiar contraseña de un usuario específico
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 */
router.put('/users/:userId/password', verifyToken, requireAdmin, changeUserPassword);

/**
 * @openapi
 * /api/auth/users/{userId}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/users/:userId', verifyToken, requireAdmin, deleteUser);

/**
 * @openapi
 * /api/auth/permissions/definitions:
 *   get:
 *     summary: Obtener lista completa de permisos disponibles
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Definiciones de permisos
 */
router.get('/permissions/definitions', verifyToken, requireAdmin, getPermissionDefinitions);

/**
 * @openapi
 * /api/auth/users/{userId}/permissions:
 *   get:
 *     summary: Obtener permisos de un usuario específico
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Permisos del usuario
 */
router.get('/users/:userId/permissions', verifyToken, requireAdmin, getUserPermissions);

/**
 * @openapi
 * /api/auth/users/{userId}/permissions:
 *   patch:
 *     summary: Actualizar permisos parcialmente (merge)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties:
 *               type: boolean
 *     responses:
 *       200:
 *         description: Permisos actualizados
 */
router.patch('/users/:userId/permissions', verifyToken, requireAdmin, updateUserPermissions);

/**
 * @openapi
 * /api/auth/users/{userId}/permissions:
 *   put:
 *     summary: Reemplazar todos los permisos de un usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties:
 *               type: boolean
 *     responses:
 *       200:
 *         description: Permisos reemplazados
 */
router.put('/users/:userId/permissions', verifyToken, requireAdmin, setUserPermissions);

module.exports = router;
