/**
 * Authentication Controller
 * Manejo de login y recuperación de contraseña
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../services/database');
const { AppError } = require('../../middleware/errorHandler');

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
    const users = await query('SELECT id, username, role FROM users WHERE id = $1', [decoded.id]);

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

module.exports = {
  login,
  resetPassword,
  verifyToken,
  requireAdmin,
  getCurrentUser,
};