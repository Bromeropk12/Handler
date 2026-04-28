/**
 * Middleware de Permisos Granulares
 * Uso: requirePermission('samples.delete')
 * Siempre se usa después de verifyToken
 */

const { AppError } = require('./errorHandler');

/**
 * Verifica si el usuario tiene un permiso específico.
 * Los administradores principales (primer admin creado) siempre tienen acceso total.
 * Para los demás usuarios, se consulta su objeto `permissions` en req.user.
 *
 * @param {string} permissionKey - La clave del permiso, ej: 'samples.delete'
 */
const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return next(new AppError('No autenticado', 401));
    }

    // Los administradores con todos los permisos explícitos en true siempre pasan
    // Verificar permiso en el objeto permissions del usuario
    const permissions = user.permissions || {};
    const hasPermission = permissions[permissionKey] === true;

    if (!hasPermission) {
      return next(new AppError(
        `No tiene permiso para realizar esta acción. Permiso requerido: "${permissionKey}"`,
        403
      ));
    }

    next();
  };
};

/**
 * Verificar múltiples permisos (requiere TODOS)
 * requireAllPermissions('samples.edit', 'samples.view')
 */
const requireAllPermissions = (...permissionKeys) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return next(new AppError('No autenticado', 401));

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

    const permissions = user.permissions || {};
    const hasAny = permissionKeys.some(k => permissions[k] === true);

    if (!hasAny) {
      return next(new AppError(
        `No tiene ninguno de los permisos requeridos: ${permissionKeys.join(', ')}`,
        403
      ));
    }
    next();
  };
};

module.exports = { requirePermission, requireAllPermissions, requireAnyPermission };
