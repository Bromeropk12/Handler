-- =============================================================================
-- MIGRATION 004: Extend action_type ENUM
-- Agrega los action_type usados por el módulo de autenticación (auth/controller.js)
-- que no estaban definidos en el enum original.
-- =============================================================================

-- PostgreSQL no permite DROP/CREATE en enums dentro de transacciones activas,
-- pero sí permite ALTER TYPE ... ADD VALUE si se hace en su propia transacción.
-- Usamos IF NOT EXISTS para que sea idempotente (re-ejecutable sin error).

ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'password_change';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'username_change';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'user_created';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'user_deleted';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'admin_password_change';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'permissions_updated';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'permissions_set';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'backup_restored_event';
