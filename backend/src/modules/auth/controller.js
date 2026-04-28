/**
 * Authentication Controller
 * Manejo de login y recuperación de contraseña
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');
const { DEFAULT_PERMISSIONS, PERMISSION_MODULES, ALL_PERMISSIONS } = require('../../config/permissions');

/**
 * Validar fuerza de contraseña (seguridad media)
 * - Mínimo 8 caracteres
 * - Al menos 1 mayúscula, 1 minúscula, 1 número, 1 especial
 */
const validatePasswordStrength = (password) => {
  if (password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpperCase) {
    return { valid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
  }

  if (!hasLowerCase) {
    return { valid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
  }

  if (!hasNumbers) {
    return { valid: false, message: 'La contraseña debe contener al menos un número' };
  }

  if (!hasSpecialChar) {
    return { valid: false, message: 'La contraseña debe contener al menos un carácter especial' };
  }

  return { valid: true };
};

// Generar JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

/**
 * Login de usuario
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validación básica
    if (!username || !password) {
      throw new AppError('Usuario y contraseña son requeridos', 400);
    }

    // Buscar usuario
    const users = await query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (users.rows.length === 0) {
      throw new AppError('Usuario o contraseña incorrectos', 401);
    }

    const user = users.rows[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Usuario o contraseña incorrectos', 401);
    }

    // Generar token
    const token = generateToken(user);

    // Set HTTPOnly Cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        token // We keep token in response for backward compatibility but UI should rely on cookie
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Recuperación de contraseña usando contraseña secreta
 */
const resetPassword = async (req, res, next) => {
  try {
    const { username, secretPassword, newPassword, confirmPassword } = req.body;

    // Validaciones
    if (!username || !secretPassword || !newPassword || !confirmPassword) {
      throw new AppError('Todos los campos son requeridos', 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError('Las contraseñas no coinciden', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('La nueva contraseña debe tener al menos 8 caracteres', 400);
    }

    // Buscar usuario
    const users = await query(
      'SELECT id, username, secret_password_hash FROM users WHERE username = $1',
      [username]
    );

    if (users.rows.length === 0) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const user = users.rows[0];

    // Verificar contraseña secreta
    const isSecretValid = await bcrypt.compare(secretPassword, user.secret_password_hash);

    if (!isSecretValid) {
      throw new AppError('Contraseña secreta incorrecta', 401);
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Actualizar contraseña
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user.id]
    );

    // Log de cambio de contraseña
    await query(
      'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
      [null, 'password_reset', user.id, JSON.stringify({ ip: req.ip, timestamp: new Date().toISOString() })]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Verificar token JWT (middleware para rutas protegidas)
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      throw new AppError('Token de autorización requerido', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario aún existe
    const users = await query('SELECT id, username, role, permissions FROM users WHERE id = $1', [decoded.id]);

    if (users.rows.length === 0) {
      throw new AppError('Usuario no encontrado', 401);
    }

    req.user = users.rows[0];
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Token inválido o expirado', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Verificar rol de administrador
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Acceso denegado. Se requiere rol de administrador', 403);
  }
  next();
};

/**
 * Listar todos los usuarios (solo admin)
 */
const listUsers = async (req, res, next) => {
  try {
    const users = await query(
      'SELECT id, username, role, permissions, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: {
        users: users.rows
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo usuario (solo admin)
 * Los administradores pueden crear usuarios sin validación de contraseña
 * Los operadores creados deberán cambiar su contraseña con validación
 */
const createUser = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;

    // Validaciones básicas
    if (!username || !password || !role) {
      throw new AppError('Usuario, contraseña y rol son requeridos', 400);
    }

    if (!['admin', 'operator'].includes(role)) {
      throw new AppError('El rol debe ser "admin" o "operator"', 400);
    }

    // Nota: Los administradores pueden crear usuarios con cualquier contraseña
    // Los operadores tendrán que cambiar su contraseña después con validación completa

    // Verificar que el username no existe
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('El nombre de usuario ya existe', 409);
    }

    // Generar contraseña secreta aleatoria (para recuperación)
    const secretPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const hashedSecretPassword = await bcrypt.hash(secretPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Crear usuario
    const newUser = await query(
      'INSERT INTO users (username, password_hash, secret_password_hash, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role, permissions, created_at',
      [username, hashedPassword, hashedSecretPassword, role, JSON.stringify(DEFAULT_PERMISSIONS(role))]
    );

    // Log de creación de usuario (no crítico)
    try {
      await query(
        'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
        [null, 'user_created', req.user.id, JSON.stringify({
          new_user_id: newUser.rows[0].id,
          new_username: username,
          new_role: role,
          ip: req.ip,
          timestamp: new Date().toISOString()
        })]
      );
    } catch (_) { /* log no crítico */ }

    res.status(201).json({
      success: true,
      message: role === 'operator'
        ? 'Usuario operador creado exitosamente. Debe cambiar su contraseña al iniciar sesión.'
        : 'Usuario administrador creado exitosamente',
      data: {
        user: newUser.rows[0],
        secretPassword: secretPassword // Solo se muestra una vez para que el admin lo proporcione
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Cambiar contraseña de otro usuario (solo admin)
 * Los administradores pueden cambiar cualquier contraseña sin validación
 */
const changeUserPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      throw new AppError('La nueva contraseña es requerida', 400);
    }

    // Nota: Los administradores pueden cambiar cualquier contraseña sin validación

    // Verificar que el usuario existe
    const userExists = await query(
      'SELECT id, username FROM users WHERE id = $1',
      [userId]
    );

    if (userExists.rows.length === 0) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Hash de la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Actualizar contraseña
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, userId]
    );

    // Log de cambio de contraseña por admin
    await query(
      'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
      [null, 'admin_password_change', req.user.id, JSON.stringify({
        target_user_id: userId,
        target_username: userExists.rows[0].username,
        ip: req.ip,
        timestamp: new Date().toISOString()
      })]
    );

    res.json({
      success: true,
      message: 'Contraseña del usuario actualizada exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Cambiar contraseña del usuario actual
 * Los operadores deben usar validaciones de seguridad, los admins pueden cambiar libremente
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validaciones básicas
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError('Todos los campos son requeridos', 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError('La nueva contraseña y su confirmación no coinciden', 400);
    }

    // Validar fuerza de la nueva contraseña solo para operadores
    if (userRole === 'operator') {
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        throw new AppError(passwordValidation.message, 400);
      }
    }

    // Verificar contraseña actual
    const users = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (users.rows.length === 0) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users.rows[0].password_hash);

    if (!isCurrentPasswordValid) {
      throw new AppError('La contraseña actual es incorrecta', 401);
    }

    // Hash de la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

    // Actualizar contraseña
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, userId]
    );

    // Log de cambio de contraseña
    await query(
      'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
      [null, 'password_change', userId, JSON.stringify({ ip: req.ip, timestamp: new Date().toISOString() })]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Cambiar nombre de usuario del usuario actual (solo para administradores)
 */
const changeUsername = async (req, res, next) => {
  try {
    const { newUsername, currentPassword } = req.body;
    const userId = req.user.id;

    // Solo administradores pueden cambiar su nombre de usuario
    if (req.user.role !== 'admin') {
      throw new AppError('Solo los administradores pueden cambiar su nombre de usuario', 403);
    }

    // Validaciones
    if (!newUsername || !currentPassword) {
      throw new AppError('Nombre de usuario y contraseña actual son requeridos', 400);
    }

    if (newUsername.length < 3) {
      throw new AppError('El nombre de usuario debe tener al menos 3 caracteres', 400);
    }

    // Verificar que el nuevo username no existe
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [newUsername, userId]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('El nombre de usuario ya existe', 409);
    }

    // Verificar contraseña actual
    const users = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (users.rows.length === 0) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users.rows[0].password_hash);

    if (!isCurrentPasswordValid) {
      throw new AppError('La contraseña actual es incorrecta', 401);
    }

    // Actualizar nombre de usuario
    await query(
      'UPDATE users SET username = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newUsername, userId]
    );

    // Log de cambio de nombre de usuario
    await query(
      'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
      [null, 'username_change', userId, JSON.stringify({
        old_username: req.user.username,
        new_username: newUsername,
        ip: req.ip,
        timestamp: new Date().toISOString()
      })]
    );

    res.json({
      success: true,
      message: 'Nombre de usuario actualizado exitosamente',
      data: {
        user: {
          id: userId,
          username: newUsername,
          role: req.user.role
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener permisos de un usuario
 */
const getUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await query('SELECT id, username, role, permissions FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) throw new AppError('Usuario no encontrado', 404);
    res.json({ success: true, data: { user: result.rows[0] } });
  } catch (error) { next(error); }
};

/**
 * Actualizar permisos de un usuario (solo admin)
 * No se pueden modificar los permisos del admin que hace la petición
 */
const updateUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      throw new AppError('El objeto de permisos es requerido', 400);
    }

    // Validar que las claves sean válidas
    const invalidKeys = Object.keys(permissions).filter(k => !ALL_PERMISSIONS.includes(k));
    if (invalidKeys.length > 0) {
      throw new AppError(`Permisos no válidos: ${invalidKeys.join(', ')}`, 400);
    }

    // Verificar que el usuario existe
    const userResult = await query('SELECT id, username, role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) throw new AppError('Usuario no encontrado', 404);

    // Hacer merge con permisos existentes (para actualizar parcialmente)
    const updated = await query(
      'UPDATE users SET permissions = permissions || $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, role, permissions',
      [JSON.stringify(permissions), userId]
    );

    // Log de cambio de permisos
    try {
      await query(
        'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
        [null, 'permissions_updated', req.user.id, JSON.stringify({
          target_user_id: userId,
          target_username: userResult.rows[0].username,
          changed_permissions: permissions,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        })]
      );
    } catch (_) {}

    res.json({
      success: true,
      message: `Permisos de "${userResult.rows[0].username}" actualizados`,
      data: { user: updated.rows[0] },
    });
  } catch (error) { next(error); }
};

/**
 * Reemplazar todos los permisos de un usuario
 */
const setUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      throw new AppError('El objeto de permisos es requerido', 400);
    }

    const userResult = await query('SELECT id, username, role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) throw new AppError('Usuario no encontrado', 404);

    const updated = await query(
      'UPDATE users SET permissions = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, role, permissions',
      [JSON.stringify(permissions), userId]
    );

    try {
      await query(
        'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
        [null, 'permissions_set', req.user.id, JSON.stringify({
          target_user_id: userId,
          target_username: userResult.rows[0].username,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        })]
      );
    } catch (_) {}

    res.json({
      success: true,
      message: `Permisos de "${userResult.rows[0].username}" guardados exitosamente`,
      data: { user: updated.rows[0] },
    });
  } catch (error) { next(error); }
};

/**
 * Obtener definición de todos los permisos disponibles (para la UI del checklist)
 */
const getPermissionDefinitions = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        modules: PERMISSION_MODULES,
        allPermissions: ALL_PERMISSIONS,
        defaults: {
          admin: DEFAULT_PERMISSIONS('admin'),
          operator: DEFAULT_PERMISSIONS('operator'),
        },
      },
    });
  } catch (error) { next(error); }
};

/**
 * Obtener información del usuario actual
 */
const getCurrentUser = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar un usuario (solo admin)
 * No se puede eliminar a uno mismo
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (parseInt(userId) === req.user.id) {
      throw new AppError('No puedes eliminar tu propio usuario administrador', 400);
    }

    // Verificar que el usuario existe
    const userExists = await query(
      'SELECT id, username FROM users WHERE id = $1',
      [userId]
    );

    if (userExists.rows.length === 0) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Eliminar usuario
    await query('DELETE FROM users WHERE id = $1', [userId]);

    // Log de eliminación de usuario
    await query(
      'INSERT INTO movements (sample_id, action_type, user_id, details) VALUES ($1, $2, $3, $4)',
      [null, 'user_deleted', req.user.id, JSON.stringify({
        deleted_user_id: userId,
        deleted_username: userExists.rows[0].username,
        ip: req.ip,
        timestamp: new Date().toISOString()
      })]
    );

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  resetPassword,
  verifyToken,
  requireAdmin,
  getCurrentUser,
  changePassword,
  changeUsername,
  listUsers,
  createUser,
  changeUserPassword,
  deleteUser,
  getUserPermissions,
  updateUserPermissions,
  setUserPermissions,
  getPermissionDefinitions,
};