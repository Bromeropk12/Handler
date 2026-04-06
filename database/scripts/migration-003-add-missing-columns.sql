-- Migration 003: Agregar columnas faltantes en BD existente
-- Fecha: 2026-04-06
-- 
-- Problema: La BD existente no tiene las columnas 'depth' y 'shelf_depth'
-- que fueron agregadas en el init.sql pero no en la BD real.

-- ==========================================
-- PASO 1: Agregar shelf_depth a shelves
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shelves' AND column_name = 'shelf_depth'
    ) THEN
        ALTER TABLE shelves ADD COLUMN shelf_depth INTEGER NOT NULL DEFAULT 10 
            CHECK (shelf_depth > 0 AND shelf_depth <= 50);
        RAISE NOTICE '✅ Columna shelf_depth agregada a shelves';
    ELSE
        RAISE NOTICE 'ℹ️  Columna shelf_depth ya existe en shelves';
    END IF;
END $$;

-- ==========================================
-- PASO 2: Agregar depth a dispensed_samples
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dispensed_samples' AND column_name = 'depth'
    ) THEN
        ALTER TABLE dispensed_samples ADD COLUMN depth INTEGER NOT NULL DEFAULT 1 
            CHECK (depth >= 1 AND depth <= 2);
        RAISE NOTICE '✅ Columna depth agregada a dispensed_samples';
    ELSE
        RAISE NOTICE 'ℹ️  Columna depth ya existe en dispensed_samples';
    END IF;
END $$;

-- ==========================================
-- PASO 3: Actualizar datos existentes
-- ==========================================
-- Asignar depth=1 a todas las muestras existentes (asumiendo formato 2D anterior)
UPDATE dispensed_samples SET depth = 1 WHERE depth IS NULL;

-- ==========================================
-- PASO 4: Verificar
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
