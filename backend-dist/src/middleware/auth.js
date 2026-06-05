const jwt = require('jsonwebtoken');
const { query } = require('../services/database');

// Función para autenticar JWT
const authenticate = (req, res, next) => {
  try {
    let token = null;

    // 1. Intentar leer desde Secure Cookie
    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    } 
    // 2. Fallback a Authorization Header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Función para verificar roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso no autorizado' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};