/**
 * Admin Recovery Service
 * Permite crear o restablecer un usuario administrador leyendo
 * el archivo admin-recovery.json desde la carpeta raíz del proyecto.
 *
 * Esquema real de la tabla users:
 *   id, username, password_hash, secret_password_hash (NOT NULL),
 *   role (user_role ENUM), permissions (JSONB), created_at, updated_at
 */

const fs   = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query } = require('./database');

async function runAdminRecovery() {
  try {
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
      return;
    }

    const { username, password } = configData;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      console.warn('[ADMIN RECOVERY] ERROR: "username" es requerido y no puede estar vacío.');
      return;
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
      console.warn('[ADMIN RECOVERY] ERROR: "password" es requerido y no puede estar vacío.');
      return;
    }

    const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, ROUNDS);

    // El campo secret_password_hash es NOT NULL en el schema.
    // En recovery lo igualamos al password principal (el admin puede cambiarlo luego).
    const hashedSecret = hashedPassword;

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
    console.log('[ADMIN RECOVERY] ✓ Puedes iniciar sesión con las credenciales del archivo.');
    console.log('[ADMIN RECOVERY] TIP: Elimina admin-recovery.json en producción por seguridad.');
    console.log('[ADMIN RECOVERY] ─────────────────────────────────────────');

  } catch (error) {
    console.error('[ADMIN RECOVERY] ERROR FATAL:', error.message);
    // No lanzamos el error para no bloquear el arranque del servidor
  }
}

module.exports = { runAdminRecovery };
