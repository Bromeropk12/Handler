/**
 * Path Security Utilities
 *
 * Centraliza validaciones para evitar path traversal al servir / aceptar
 * rutas del sistema de archivos (CoA, uploads, etc.).
 */

const path = require('path');
const fs = require('fs');

/**
 * Raíces permitidas para directorios configurables desde la BD (ej. coa_base_dir).
 * Si el directorio configurado NO se resuelve bajo alguna de estas raíces, se rechaza.
 */
const ALLOWED_ROOTS = (() => {
  const roots = [
    path.resolve(process.cwd(), 'uploads'),
    path.resolve(process.cwd(), 'storage'),
    path.resolve(process.cwd()),
  ];
  // Añadir el COA_BASE_DIR por defecto como raíz válida
  const defaultCoa = process.env.COA_BASE_DIR;
  if (defaultCoa) {
    roots.push(path.resolve(defaultCoa));
  }
  // Añadir directorio de datos de producción (ProgramData en Windows)
  // Para que rutas bajo C:\ProgramData\HandlerTrackSamples\uploads\coa sean válidas
  const programDataDir = path.join(
    process.env.ALLUSERSPROFILE || 'C:\\ProgramData',
    'HandlerTrackSamples'
  );
  roots.push(programDataDir);
  roots.push(path.join(programDataDir, 'uploads'));
  roots.push(path.join(programDataDir, 'uploads', 'coa'));

  // Eliminar duplicados y entradas inválidas
  return [...new Set(roots.filter(Boolean))];
})();

/**
 * Normaliza una ruta y verifica que se mantenga dentro de las raíces permitidas.
 *
 * @param {string} inputPath - ruta propuesta (puede ser relativa o absoluta)
 * @param {object} [opts]
 * @param {boolean} [opts.mustExist=false] - si true, la ruta debe existir y ser directorio
 * @returns {string} ruta absoluta normalizada
 * @throws {Error} si la ruta está vacía, no es string, contiene segmentos nulos,
 *                 no se puede normalizar, o queda fuera de las raíces permitidas.
 */
function resolveSafePath(inputPath, opts = {}) {
  const { mustExist = false } = opts;

  if (typeof inputPath !== 'string' || inputPath.trim() === '') {
    throw new Error('La ruta proporcionada está vacía o no es válida');
  }

  // Rechazar segmentos nulos (ataques específicos Windows/Unix)
  if (inputPath.includes('\0')) {
    throw new Error('La ruta contiene caracteres nulos no permitidos');
  }

  // path.resolve normaliza "..", ".", y colapsa separadores
  const resolved = path.resolve(inputPath);

  // Rechazar rutas que se resuelvan fuera de las raíces permitidas
  const isUnderAllowedRoot = ALLOWED_ROOTS.some(
    (root) => resolved === root || resolved.startsWith(root + path.sep)
  );

  if (!isUnderAllowedRoot) {
    throw new Error(
      `La ruta resuelta "${resolved}" está fuera de las raíces permitidas. ` +
      `Solo se permiten rutas dentro de: ${ALLOWED_ROOTS.join(', ')}`
    );
  }

  if (mustExist) {
    let stat;
    try {
      stat = fs.statSync(resolved);
    } catch (err) {
      throw new Error(`La ruta "${resolved}" no existe o no es accesible`);
    }
    if (!stat.isDirectory()) {
      throw new Error(`La ruta "${resolved}" no es un directorio`);
    }
  }

  return resolved;
}

/**
 * Valida que un archivo solicitado se encuentre dentro de un directorio base.
 * Defensa en profundidad contra path traversal en rutas servidas por express.
 *
 * @param {string} baseDir - directorio base (debe estar validado previamente)
 * @param {string} filename - nombre de archivo solicitado por el cliente
 * @returns {string} ruta absoluta segura
 * @throws {Error} si el filename intenta escapar del baseDir
 */
function resolveSafeFilePath(baseDir, filename) {
  if (typeof filename !== 'string' || filename === '') {
    throw new Error('Nombre de archivo inválido');
  }
  if (filename.includes('\0') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('Nombre de archivo contiene separadores de ruta no permitidos');
  }
  // path.basename recorta cualquier ".." o separador que el cliente haya colado
  const safeName = path.basename(filename);
  const fullPath = path.join(baseDir, safeName);
  const resolvedBase = path.resolve(baseDir);
  const resolvedFull = path.resolve(fullPath);

  if (resolvedFull !== resolvedBase && !resolvedFull.startsWith(resolvedBase + path.sep)) {
    throw new Error('Ruta solicitada fuera del directorio permitido');
  }

  return resolvedFull;
}

module.exports = {
  ALLOWED_ROOTS,
  resolveSafePath,
  resolveSafeFilePath,
};
