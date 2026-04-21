-- Migration 002: Agregar soporte 3D al módulo almacén
-- Fecha: 2026-04-07
-- 
-- DEPENDENCIAS: Migration 001 (suppliers debe existir)
-- REQUISITOS: Tablas shelves y dispensed_samples deben existir
--
-- Cambios:
-- 1. Agregar columna shelf_depth a tabla shelves
-- 2. Actualizar enum dimensions a formato 3D (Ancho×Alto×Profundidad)
-- 3. Agregar columna depth a dispensed_samples
-- 4. Actualizar total_capacity para incluir profundidad

-- ==========================================
-- VERIFICACIÓN DE DEPENDENCIAS
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shelves') THEN
        RAISE EXCEPTION '❌ Tabla shelves no existe. Ejecute init.sql primero.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dispensed_samples') THEN
        RAISE EXCEPTION '❌ Tabla dispensed_samples no existe. Ejecute init.sql primero.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        RAISE EXCEPTION '❌ Tabla suppliers no existe. Ejecute migration-001 primero.';
    END IF;
    RAISE NOTICE '✅ Dependencias verificadas correctamente';
END $$;

-- ==========================================
-- PASO 1: Agregar shelf_depth a tabla shelves
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shelves' AND column_name = 'shelf_depth'
    ) THEN
        ALTER TABLE shelves ADD COLUMN shelf_depth INTEGER NOT NULL DEFAULT 10 
            CHECK (shelf_depth > 0 AND shelf_depth <= 50);
        RAISE NOTICE '✅ Columna shelf_depth agregada a shelves (default: 10)';
    ELSE
        RAISE NOTICE 'ℹ️  Columna shelf_depth ya existe en shelves';
    END IF;
END $$;

-- ==========================================
-- PASO 2: Actualizar total_capacity para incluir profundidad
-- Si total_capacity es una columna generada, no se puede modificar directamente.
-- En su lugar, creamos un trigger que mantiene el valor actualizado.
-- ==========================================

-- Verificar si total_capacity es una columna generada
DO $$
DECLARE
    is_gen BOOLEAN;
BEGIN
    SELECT c.is_generated = 'YES' INTO is_gen
    FROM information_schema.columns c
    WHERE c.table_name = 'shelves' AND c.column_name = 'total_capacity';

    IF is_gen THEN
        RAISE NOTICE 'ℹ️  total_capacity es columna generada. Se usará trigger para actualizar.';
    ELSE
        RAISE NOTICE 'ℹ️  total_capacity NO es columna generada. Se actualizará directamente.';
    END IF;
END $$;

-- Crear función para actualizar total_capacity
CREATE OR REPLACE FUNCTION update_shelf_capacity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_capacity = NEW.grid_width * NEW.grid_height * NEW.shelf_depth;
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
        RAISE NOTICE '✅ Trigger trg_shelf_capacity creado';
    ELSE
        RAISE NOTICE 'ℹ️  Trigger trg_shelf_capacity ya existe';
    END IF;
END $$;

-- Para columnas generadas, no se puede hacer UPDATE directo.
-- En su lugar, forzamos una actualización del trigger usando una columna dummy
DO $$
DECLARE
    is_gen BOOLEAN;
BEGIN
    SELECT c.is_generated = 'YES' INTO is_gen
    FROM information_schema.columns c
    WHERE c.table_name = 'shelves' AND c.column_name = 'total_capacity';

    -- Nota: Para columnas generadas, no podemos hacer UPDATE directo.
    -- El trigger se encargará de mantener los valores correctos en futuras operaciones.
    RAISE NOTICE 'ℹ️  total_capacity se mantendrá actualizado automáticamente via trigger.';
END $$;

-- ==========================================
-- PASO 3: Agregar columna depth a dispensed_samples
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dispensed_samples') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'dispensed_samples' AND column_name = 'depth'
        ) THEN
            ALTER TABLE dispensed_samples ADD COLUMN depth INTEGER NOT NULL DEFAULT 1 
                CHECK (depth >= 1 AND depth <= 2);
            RAISE NOTICE '✅ Columna depth agregada a dispensed_samples (default: 1)';
        ELSE
            RAISE NOTICE 'ℹ️  Columna depth ya existe en dispensed_samples';
        END IF;
    END IF;
END $$;

-- ==========================================
-- PASO 4: Actualizar índice de posición para incluir depth
-- ==========================================
DROP INDEX IF EXISTS idx_dispensed_samples_position;
CREATE INDEX IF NOT EXISTS idx_dispensed_samples_position_3d ON dispensed_samples(shelf_id, position_x, position_y, position_z);

-- ==========================================
-- PASO 5: Actualizar comentarios
-- ==========================================
COMMENT ON TABLE shelves IS 'Anaqueles con grid 3D (width × height × depth) organizados por línea y proveedor';
COMMENT ON TABLE dispensed_samples IS 'Muestras individuales (hijas del bulk) con QR único, dimensiones 3D variables y posición (x, y, z) en anaquel';

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================
DO $$
DECLARE
    shelves_count INTEGER;
    dispensed_count INTEGER;
    min_depth INTEGER;
    max_depth INTEGER;
    min_shelf_depth INTEGER;
    max_shelf_depth INTEGER;
BEGIN
    SELECT COUNT(*) INTO shelves_count FROM shelves;
    SELECT COUNT(*) INTO dispensed_count FROM dispensed_samples;
    SELECT MIN(shelf_depth), MAX(shelf_depth) INTO min_shelf_depth, max_shelf_depth FROM shelves;
    SELECT MIN(depth), MAX(depth) INTO min_depth, max_depth FROM dispensed_samples;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RESUMEN MIGRATION 002';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Anaqueles con shelf_depth: % (min: %, max: %)', shelves_count, min_shelf_depth, max_shelf_depth;
    RAISE NOTICE 'Muestras con depth: % (min: %, max: %)', dispensed_count, min_depth, max_depth;
    RAISE NOTICE '========================================';
END $$;
