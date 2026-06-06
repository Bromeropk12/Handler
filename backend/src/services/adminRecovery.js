/**
 * Admin Recovery Service
 * Permite crear o restablecer un usuario administrador leyendo
 * el archivo admin-recovery.json desde la carpeta raíz del proyecto.
 *
 * El archivo se AUTO-ELIMINA tras ser procesado para evitar que
 * un atacante con acceso al filesystem pueda reusarlo en cada
 * reinicio del servicio.
 *
 * Esquema real de la tabla users:
 *   id, username, password_hash, secret_password_hash (NOT NULL),
 *   role (user_role ENUM), permissions (JSONB), created_at, updated_at
 */

const fs   = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query } = require('./database');

// Lista de contraseñas explícitamente prohibidas en el recovery
// (las mismas que se usan en los default-secrets del config).
const FORBIDDEN_PASSWORDS = new Set([
  'password', 'Password', 'PASSWORD',
  'admin', 'admin123', 'admin1234', 'administrator',
  '123456', '12345678', '123456789', '1234567890',
  'qwerty', 'letmein', 'welcome', 'monkey', 'dragon',
  'handler', 'handler123', 'handler2026',
  '!Handler2026', 'Handler2026',
  'root', 'toor', 'changeme', 'secret',
]);

function isPasswordStrongEnough(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 12) return false;                  // Mínimo 12 chars
  if (FORBIDDEN_PASSWORDS.has(password)) return false;    // Lista negra
  if (/^(.)\1+$/.test(password)) return false;            // Todos iguales (aaaa...)
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasDigit && hasSymbol;
}

async function runAdminRecovery() {
  try {
    // Seguridad: en producción, el admin-recovery solo se ejecuta si
    // se ha habilitado explícitamente con ALLOW_ADMIN_RECOVERY=true en .env.
    // Evita que un atacante con acceso al filesystem cree admins automáticamente.
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_RECOVERY !== 'true') {
      const configPath = path.join(process.cwd(), '../admin-recovery.json');
      if (fs.existsSync(configPath)) {
        console.warn('[ADMIN RECOVERY] ⚠️  admin-recovery.json detectado pero BLOQUEADO en producción.');
        console.warn('[ADMIN RECOVERY] Para habilitarlo, define ALLOW_ADMIN_RECOVERY=true en .env');
        console.warn('[ADMIN RECOVERY] Eliminando el archivo por seguridad...');
        try { fs.unlinkSync(configPath); } catch (_) {}
      }
      return;
    }

    // Buscar el archivo en la carpeta raíz del proyecto
    // process.cwd() = .../Handler/backend   →   '../' = .../Handler/
    const configPath = path.join(process.cwd(), '../admin-recovery.json');

    if (!fs.existsSync(configPath)) {
      return; // Archivo no existe → nada que hacer
    }

    console.log('[ADMIN RECOVERY] ─────────────────────────────────────────');
    console.log('[ADMIN RECOVERY] Archivo admin-recovery.json detectado.');
    console.log('[ADMIN RECOVERY] Ejecutando recuperación de acceso...');

    let configData;
    try {
      configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (parseErr) {
      console.error('[ADMIN RECOVERY] ERROR: El archivo admin-recovery.json no es JSON válido:', parseErr.message);
      // Borrar el archivo corrupto para que no bloquee futuros arranques
      try { fs.unlinkSync(configPath); } catch (_) {}
      return;
    }

    const { username, password } = configData;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      console.warn('[ADMIN RECOVERY] ERROR: "username" es requerido y no puede estar vacío. Archivo NO procesado (se elimina por seguridad).');
      try { fs.unlinkSync(configPath); } catch (_) {}
      return;
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
      console.warn('[ADMIN RECOVERY] ERROR: "password" es requerido y no puede estar vacío. Archivo NO procesado (se elimina por seguridad).');
      try { fs.unlinkSync(configPath); } catch (_) {}
      return;
    }

    // Validar fortaleza de la contraseña antes de aceptar el recovery
    if (!isPasswordStrongEnough(password)) {
      console.error('[ADMIN RECOVERY] ✗ RECHAZADO: la contraseña del archivo es demasiado débil.');
      console.error('[ADMIN RECOVERY] Requisitos mínimos: 12 caracteres, mayúscula, minúscula, número y símbolo. No puede ser una contraseña común.');
      // Borrar SIEMPRE el archivo aunque sea rechazado, para evitar reintentos
      try { fs.unlinkSync(configPath); } catch (_) {}
      console.error('[ADMIN RECOVERY] Archivo eliminado por seguridad. Genera uno nuevo con una contraseña fuerte.');
      console.log('[ADMIN RECOVERY] ─────────────────────────────────────────');
      return;
    }

    const ROUNDS = (() => {
      const n = parseInt(process.env.BCRYPT_ROUNDS, 10);
      return (Number.isFinite(n) && n >= 4 && n <= 15) ? n : 12;
    })();
    const hashedPassword = await bcrypt.hash(password, ROUNDS);

    // (C6) El campo secret_password_hash DEBE ser independiente de password_hash.
    // Generamos un secreto criptográficamente aleatorio de 32 bytes (64 hex chars)
    // que el operador DEBE comunicar al usuario por un canal fuera de banda
    // (no por el mismo archivo, no por logs, no por respuesta HTTP).
    //
    // Riesgo histórico: si secret_password_hash == password_hash, cualquier
    // atacante que conozca el password del usuario puede resetear la cuenta
    // de CUALQUIER OTRO usuario vía /api/auth/reset-password (que solo pide
    // username + secret_password). El "2FA" deja de ser 2FA.
    const crypto = require('crypto');
    const secretPassword = crypto.randomBytes(32).toString('hex');
    const hashedSecret = await bcrypt.hash(secretPassword, ROUNDS);

    // Permisos completos de administrador
    const adminPermissions = {
      'dashboard.view': true,
      'samples.view': true, 'samples.create': true, 'samples.edit': true,
      'samples.delete': true, 'samples.export': true, 'samples.view_coa': true,
      'dispensing.view': true, 'dispensing.create': true, 'dispensing.reassign': true,
      'dispatch.view': true, 'dispatch.execute': true, 'dispatch.fefo': true,
      'warehouse.view': true, 'warehouse.create_shelf': true, 'warehouse.edit_shelf': true,
      'warehouse.delete_shelf': true, 'warehouse.place_sample': true,
      'warehouse.move_sample': true, 'warehouse.remove_sample': true,
      'warehouse.defragment': true,
      'movements.view': true, 'movements.export': true,
      'suppliers.view': true, 'suppliers.create': true, 'suppliers.edit': true, 'suppliers.delete': true,
      'market_lines.view': true, 'market_lines.create': true, 'market_lines.edit': true, 'market_lines.delete': true,
      'alerts.view': true,
      'reports.view': true,
    };

    // UPSERT: inserta si no existe, actualiza contraseña si ya existe
    await query(`
      INSERT INTO users (
        username,
        password_hash,
        secret_password_hash,
        role,
        permissions,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 'admin', $4::jsonb, NOW(), NOW())
      ON CONFLICT (username) DO UPDATE
        SET password_hash        = EXCLUDED.password_hash,
            secret_password_hash = EXCLUDED.secret_password_hash,
            role                 = 'admin',
            permissions          = $4::jsonb,
            updated_at           = NOW()
    `, [username.trim(), hashedPassword, hashedSecret, JSON.stringify(adminPermissions)]);

    console.log(`[ADMIN RECOVERY] ✓ Usuario '${username.trim()}' listo con rol ADMIN.`);
    console.log('[ADMIN RECOVERY] ✓ Puedes iniciar sesión con la contraseña del archivo.');
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  CONTRASEÑA SECRETA (2FA) — COMUNICAR AL USUARIO POR CANAL   ║');
    console.log('║  SEGURO FUERA DE BANDA (NO por el archivo, NO por HTTP)      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log(`  Username:           ${username.trim()}`);
    console.log(`  Password:           ${password}`);
    console.log(`  Contraseña secreta: ${secretPassword}`);
    console.log('  (Esta contraseña secreta se usará para reset-password. Guárdala offline.)');
    console.log('');
    console.log('[ADMIN RECOVERY] ✓ Archivo admin-recovery.json ELIMINADO por seguridad (auto-destrucción).');
    console.log('[ADMIN RECOVERY] ─────────────────────────────────────────');

    // AUTO-DESTRUCCIÓN: borrar el archivo para que no se re-procese en cada reinicio
    try {
      fs.unlinkSync(configPath);
      console.log('[ADMIN RECOVERY] Archivo eliminado del disco.');
    } catch (unlinkErr) {
      console.error('[ADMIN RECOVERY] ADVERTENCIA: no se pudo eliminar el archivo automáticamente. Hazlo manualmente:', configPath);
    }

  } catch (error) {
    console.error('[ADMIN RECOVERY] ERROR FATAL:', error.message);
    // No lanzamos el error para no bloquear el arranque del servidor
  }
}

module.exports = { runAdminRecovery, isPasswordStrongEnough, FORBIDDEN_PASSWORDS };
