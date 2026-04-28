-- Migration 009: Sistema de Permisos Granulares por Usuario
-- Agrega columna JSONB 'permissions' a la tabla users
-- Compatible con PostgreSQL 12+

-- 1. Agregar columna permissions con valor por defecto vacío
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Asignar permisos por defecto a usuarios existentes según su rol
--    Admins: todos los permisos en true
--    Operators: permisos de solo lectura/uso básico

UPDATE users SET permissions = '{
  "dashboard.view": true,
  "samples.view": true,
  "samples.create": true,
  "samples.edit": true,
  "samples.delete": true,
  "samples.export": true,
  "samples.view_coa": true,
  "dispensing.view": true,
  "dispensing.create": true,
  "dispensing.reassign": true,
  "dispatch.view": true,
  "dispatch.execute": true,
  "dispatch.fefo": true,
  "warehouse.view": true,
  "warehouse.create_shelf": true,
  "warehouse.edit_shelf": true,
  "warehouse.delete_shelf": true,
  "warehouse.place_sample": true,
  "warehouse.move_sample": true,
  "warehouse.remove_sample": true,
  "warehouse.defragment": true,
  "movements.view": true,
  "movements.export": true,
  "suppliers.view": true,
  "suppliers.create": true,
  "suppliers.edit": true,
  "suppliers.delete": true,
  "market_lines.view": true,
  "market_lines.create": true,
  "market_lines.edit": true,
  "market_lines.delete": true,
  "alerts.view": true,
  "reports.view": true
}'::jsonb
WHERE role = 'admin';

UPDATE users SET permissions = '{
  "dashboard.view": true,
  "samples.view": true,
  "samples.create": false,
  "samples.edit": false,
  "samples.delete": false,
  "samples.export": false,
  "samples.view_coa": true,
  "dispensing.view": true,
  "dispensing.create": false,
  "dispensing.reassign": false,
  "dispatch.view": true,
  "dispatch.execute": false,
  "dispatch.fefo": true,
  "warehouse.view": true,
  "warehouse.create_shelf": false,
  "warehouse.edit_shelf": false,
  "warehouse.delete_shelf": false,
  "warehouse.place_sample": false,
  "warehouse.move_sample": false,
  "warehouse.remove_sample": false,
  "warehouse.defragment": false,
  "movements.view": true,
  "movements.export": false,
  "suppliers.view": true,
  "suppliers.create": false,
  "suppliers.edit": false,
  "suppliers.delete": false,
  "market_lines.view": true,
  "market_lines.create": false,
  "market_lines.edit": false,
  "market_lines.delete": false,
  "alerts.view": true,
  "reports.view": false
}'::jsonb
WHERE role = 'operator';

-- 3. Crear índice GIN para búsquedas eficientes sobre permisos
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN (permissions);

-- Verificar resultado
SELECT id, username, role, permissions FROM users;
