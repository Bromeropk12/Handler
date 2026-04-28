/**
 * Authentication Routes
 * Rutas para login y recuperación de contraseña
 */

const express = require('express');
const {
  login, resetPassword, getCurrentUser, verifyToken, changePassword,
  changeUsername, listUsers, createUser, changeUserPassword, deleteUser,
  requireAdmin, getUserPermissions, updateUserPermissions, setUserPermissions,
  getPermissionDefinitions,
} = require('./controller');

const router = express.Router();

/**
 * POST /api/auth/login
 * Login de usuario
 */
router.post('/login', login);

/**
 * POST /api/auth/reset-password
 * Recuperación de contraseña usando contraseña secreta
 */
router.post('/reset-password', resetPassword);

/**
 * GET /api/auth/me
 * Obtener información del usuario actual (requiere autenticación)
 */
router.get('/me', verifyToken, getCurrentUser);

/**
 * POST /api/auth/change-password
 * Cambiar contraseña del usuario actual (requiere autenticación)
 */
router.post('/change-password', verifyToken, changePassword);

/**
 * GET /api/auth/users
 * Listar todos los usuarios (requiere admin)
 */
router.get('/users', verifyToken, requireAdmin, listUsers);

/**
 * POST /api/auth/users
 * Crear nuevo usuario (requiere admin)
 */
router.post('/users', verifyToken, requireAdmin, createUser);

/**
 * PUT /api/auth/users/:id/password
 * Cambiar contraseña de un usuario específico (requiere admin)
 */
router.put('/users/:userId/password', verifyToken, requireAdmin, changeUserPassword);

/**
 * PUT /api/auth/change-username
 * Cambiar nombre de usuario del usuario actual (solo admins)
 */
router.put('/change-username', verifyToken, requireAdmin, changeUsername);

/**
 * DELETE /api/auth/users/:userId
 * Eliminar un usuario (requiere admin)
 */
router.delete('/users/:userId', verifyToken, requireAdmin, deleteUser);

/**
 * GET /api/auth/permissions/definitions
 * Obtener la lista completa de permisos disponibles con descripciones
 */
router.get('/permissions/definitions', verifyToken, requireAdmin, getPermissionDefinitions);

/**
 * GET /api/auth/users/:userId/permissions
 * Obtener permisos de un usuario específico
 */
router.get('/users/:userId/permissions', verifyToken, requireAdmin, getUserPermissions);

/**
 * PATCH /api/auth/users/:userId/permissions
 * Actualizar permisos parcialmente (merge)
 */
router.patch('/users/:userId/permissions', verifyToken, requireAdmin, updateUserPermissions);

/**
 * PUT /api/auth/users/:userId/permissions
 * Reemplazar todos los permisos de un usuario
 */
router.put('/users/:userId/permissions', verifyToken, requireAdmin, setUserPermissions);

module.exports = router;