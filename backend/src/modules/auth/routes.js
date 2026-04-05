/**
 * Authentication Routes
 * Rutas para login y recuperación de contraseña
 */

const express = require('express');
const { login, resetPassword, getCurrentUser, verifyToken } = require('./controller');

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

module.exports = router;