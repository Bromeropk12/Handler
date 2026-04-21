/**
 * Authentication Routes
 * Rutas para login y recuperación de contraseña
 */

const express = require('express');
const { login, resetPassword, getCurrentUser, verifyToken, changePassword, changeUsername, listUsers, createUser, changeUserPassword, deleteUser, requireAdmin } = require('./controller');

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

module.exports = router;