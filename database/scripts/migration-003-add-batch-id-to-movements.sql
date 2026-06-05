-- =============================================================================
-- Migración 003: añadir batch_id a movements
--
-- Necesario para que `commitGroupMove` pueda agrupar N movimientos
-- (drag-en-grupo) bajo un mismo UUID. Esto permite:
--   - Filtrar logs por lote de commit (auditoría)
--   - Revertir un commit grupal completo (rollback por batch_id)
--   - Mostrar al usuario "3 muestras movidas en 1 operación"
--
-- La columna es NULL por default: los INSERT existentes (sin batch_id)
-- siguen funcionando sin cambios. Idempotente: si la columna ya existe
-- (re-running migrations en dev), no falla.
-- =============================================================================

ALTER TABLE movements
  ADD COLUMN IF NOT EXISTS batch_id UUID;

-- Índice para queries por batch_id
CREATE INDEX IF NOT EXISTS idx_movements_batch_id ON movements(batch_id)
  WHERE batch_id IS NOT NULL;

-- Comentario para la nueva columna
COMMENT ON COLUMN movements.batch_id IS 'UUID compartido por todos los movimientos de un commit grupal atómico (drag-en-grupo)';
