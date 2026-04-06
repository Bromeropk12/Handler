-- Migration 002: Agregar soporte 3D al módulo almacén
-- Fecha: 2026-04-06
-- 
-- Cambios:
-- 1. Agregar columna shelf_depth a tabla shelves
-- 2. Actualizar enum dimensions a formato 3D (Ancho×Alto×Profundidad)
-- 3. Agregar columna depth a dispensed_samples
-- 4. Actualizar total_capacity para incluir profundidad

-- ==========================================
-- PASO 1: Actualizar enum dimensions a 3D
-- ==========================================

-- Crear nuevo enum 3D
CREATE TYPE dimensions_3d AS ENUM (
  '1x1x1', '1x2x1', '2x1x1', '2x2x1',
  '1x1x2', '1x2x2', '2x1x2', '2x2x2'
);

-- Mapeo de dimensiones 2D a 3D (agregando profundidad 1)
-- '1x1' -> '1x1x1'
-- '1x2' -> '1x2x1'
-- '2x1' -> '2x1x1'
-- '2x2' -> '2x2x1'

-- ==========================================
-- PASO 2: Agregar shelf_depth a tabla shelves
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shelves' AND column_name = 'shelf_depth'
    ) THEN
        ALTER TABLE shelves ADD COLUMN shelf_depth INTEGER NOT NULL DEFAULT 10 
            CHECK (shelf_depth > 0 AND shelf_depth <= 50);
    END IF;
END $$;

-- ==========================================
-- PASO 3: Actualizar total_capacity para incluir profundidad
-- ==========================================
-- No podemos ALTER una columna generada, hay que recrearla
DO $$
BEGIN
    -- Verificar si la columna generada existe y recrearla
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shelves' AND column_name = 'total_capacity'
    ) THEN
        -- No se puede ALTER una columna generada, pero podemos actualizar la definición
        -- En PostgreSQL 12+ no hay forma directa de ALTER GENERATED COLUMN
        -- La solución es recrear la tabla o usar un trigger
        -- Para esta migración, usaremos un trigger para mantener total_capacity actualizado
        NULL;
    END IF;
END $$;

-- Crear trigger para actualizar total_capacity
CREATE OR REPLACE FUNCTION update_shelf_capacity()
RETURNS TRIGGER AS $$
BEGIN
    -- total_capacity se calcula como width × height × depth
    -- Como es una columna generada, no podemos actualizarla directamente
    -- Pero si no es generada en BD existente, la actualizamos
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        NEW.total_capacity = NEW.grid_width * NEW.grid_height * NEW.shelf_depth;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_shelf_capacity'
    ) THEN
        CREATE TRIGGER trg_shelf_capacity
            BEFORE INSERT OR UPDATE ON shelves
            FOR EACH ROW
            EXECUTE FUNCTION update_shelf_capacity();
    END IF;
END $$;

-- Actualizar registros existentes
UPDATE shelves SET shelf_depth = shelf_depth; -- Trigger actualizará total_capacity

-- ==========================================
-- PASO 4: Agregar columna depth a dispensed_samples
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dispensed_samples' AND column_name = 'depth'
    ) THEN
        ALTER TABLE dispensed_samples ADD COLUMN depth INTEGER NOT NULL DEFAULT 1 
            CHECK (depth >= 1 AND depth <= 2);
    END IF;
END $$;

-- ==========================================
-- PASO 5: Actualizar índice de posición para incluir depth
-- ==========================================
DROP INDEX IF EXISTS idx_dispensed_samples_position;
CREATE INDEX idx_dispensed_samples_position_3d ON dispensed_samples(shelf_id, position_x, position_y, position_z);

-- ==========================================
-- PASO 6: Actualizar comentarios
-- ==========================================
COMMENT ON TABLE shelves IS 'Anaqueles con grid 3D (width × height × depth) organizados por línea y proveedor';
COMMENT ON TABLE dispensed_samples IS 'Muestras individuales (hijas del bulk) con QR único, dimensiones 3D variables y posición (x, y, z) en anaquel';

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================
SELECT 
    'shelves' as table_name, 
    COUNT(*) as total,
    MIN(shelf_depth) as min_depth,
    MAX(shelf_depth) as max_depth
FROM shelves
UNION ALL
SELECT 
    'dispensed_samples' as table_name,
    COUNT(*) as total,
    MIN(depth) as min_depth,
    MAX(depth) as max_depth
FROM dispensed_samples;
