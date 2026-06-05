/**
 * Middleware de Permisos Granulares
 * Uso: requirePermission('samples.delete')
 * Siempre se usa después de verifyToken
 *
 * REGLA DE ORO: Los admins tienen acceso total siempre (bypass completo).
 * Los operadores solo acceden si su campo permissions[key] === true.
 */

const { AppError } = require('./errorHandler');

/**
 * Verifica si el usuario tiene un permiso específico.
 * @param {string} permissionKey - La clave del permiso, ej: 'samples.delete'
 */
const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return next(new AppError('No autenticado', 401));
    }

    // ✅ Los administradores siempre tienen acceso total, sin importar permissions
    if (user.role === 'admin') {
      return next();
    }

    // Para operadores: verificar permiso en el objeto permissions del usuario
    const permissions = user.permissions || {};
    const hasPermission = permissions[permissionKey] === true;

    if (!hasPermission) {
      return next(new AppError(
        `No tienes permiso para realizar esta acción. Permiso requerido: "${permissionKey}"`,
        403
      ));
    }

    next();
  };
};

/**
 * Verificar múltiples permisos (requiere TODOS)
 */
const requireAllPermissions = (...permissionKeys) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return next(new AppError('No autenticado', 401));

    // Admins bypass
    if (user.role === 'admin') return next();

    const permissions = user.permissions || {};
    const missing = permissionKeys.filter(k => permissions[k] !== true);

    if (missing.length > 0) {
      return next(new AppError(
        `Permisos insuficientes. Faltantes: ${missing.join(', ')}`,
        403
      ));
    }
    next();
  };
};

/**
 * Verificar al menos uno de los permisos (requiere ALGUNO)
 */
const requireAnyPermission = (...permissionKeys) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return next(new AppError('No autenticado', 401));

    // Admins bypass
    if (user.role === 'admin') return next();

    const permissions = user.permissions || {};
    const hasAny = permissionKeys.some(k => permissions[k] === true);

    if (!hasAny) {
      return next(new AppError(
        `No tienes ninguno de los permisos requeridos: ${permissionKeys.join(', ')}`,
        403
      ));
    }
    next();
  };
};

module.exports = { requirePermission, requireAllPermissions, requireAnyPermission };
