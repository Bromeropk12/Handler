-- Migration 004: Corrección del Modelo de Datos
-- Fecha: 2026-04-07
-- 
-- DEPENDENCIAS: Migration 001 (suppliers), Migration 002 (3D support)
-- REQUISITOS: Tablas shelves, suppliers, global_samples deben existir
--
-- Problemas resueltos:
-- 1. Relación many-to-many entre anaqueles y proveedores
-- 2. Ubicación temporal de bulk en anaquel
-- 3. Tipo de anaquel (almacenamiento vs bulk temporal)

-- ==========================================
-- VERIFICACIÓN DE DEPENDENCIAS
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shelves') THEN
        RAISE EXCEPTION '❌ Tabla shelves no existe. Ejecute init.sql primero.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        RAISE EXCEPTION '❌ Tabla suppliers no existe. Ejecute migration-001 primero.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_samples') THEN
        RAISE EXCEPTION '❌ Tabla global_samples no existe. Ejecute init.sql primero.';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shelves' AND column_name = 'shelf_depth'
    ) THEN
        RAISE WARNING '⚠️  Columna shelf_depth no existe en shelves. Ejecute migration-002 primero.';
    END IF;
    RAISE NOTICE '✅ Dependencias verificadas correctamente';
END $$;

-- ==========================================
-- PASO 1: Tabla intermedia shelf_suppliers
-- ==========================================
CREATE TABLE IF NOT EXISTS shelf_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shelf_id UUID NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    UNIQUE(shelf_id, supplier_id)
);

-- Migrar datos existentes: si un anaquel tiene provider, vincular con el proveedor
-- Se usa UPPER(TRIM()) para normalizar nombres
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s
JOIN suppliers sup ON UPPER(TRIM(s.provider)) = sup.name
WHERE s.provider IS NOT NULL AND TRIM(s.provider) != ''
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

DO $$
DECLARE
    shelf_suppliers_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO shelf_suppliers_count FROM shelf_suppliers;
    RAISE NOTICE '✅ Tabla shelf_suppliers creada. Relaciones migradas: %', shelf_suppliers_count;
END $$;

-- ==========================================
-- PASO 2: Agregar shelf_type a shelves
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shelves' AND column_name = 'shelf_type'
    ) THEN
        ALTER TABLE shelves ADD COLUMN shelf_type VARCHAR(50) DEFAULT 'storage' 
            CHECK (shelf_type IN ('storage', 'bulk_temporary'));
        RAISE NOTICE '✅ Columna shelf_type agregada a shelves (default: storage)';
    ELSE
        RAISE NOTICE 'ℹ️  Columna shelf_type ya existe en shelves';
    END IF;
END $$;

-- ==========================================
-- PASO 3: Agregar columnas de ubicación a global_samples
-- ==========================================
DO $$
BEGIN
    -- shelf_id para ubicación temporal del bulk
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'shelf_id'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN shelf_id UUID REFERENCES shelves(id);
        RAISE NOTICE '✅ Columna shelf_id agregada a global_samples';
    END IF;

    -- position_x
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'position_x'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN position_x INTEGER;
        RAISE NOTICE '✅ Columna position_x agregada a global_samples';
    END IF;

    -- position_y
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'position_y'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN position_y INTEGER;
        RAISE NOTICE '✅ Columna position_y agregada a global_samples';
    END IF;

    -- position_z
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'position_z'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN position_z INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Columna position_z agregada a global_samples';
    END IF;

    -- width
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'width'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN width INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Columna width agregada a global_samples';
    END IF;

    -- height
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'height'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN height INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Columna height agregada a global_samples';
    END IF;

    -- depth
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'depth'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN depth INTEGER DEFAULT 1;
        RAISE NOTICE '✅ Columna depth agregada a global_samples';
    END IF;
END $$;

-- ==========================================
-- PASO 4: Crear índice para ubicación de bulk
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_global_samples_shelf ON global_samples(shelf_id);
CREATE INDEX IF NOT EXISTS idx_global_samples_position ON global_samples(shelf_id, position_x, position_y, position_z);

-- ==========================================
-- PASO 5: Verificación
-- ==========================================
DO $$
DECLARE
    shelf_suppliers_count INTEGER;
    shelves_with_type INTEGER;
    global_with_location INTEGER;
BEGIN
    SELECT COUNT(*) INTO shelf_suppliers_count FROM shelf_suppliers;
    SELECT COUNT(*) INTO shelves_with_type FROM shelves WHERE shelf_type IS NOT NULL;
    SELECT COUNT(*) INTO global_with_location FROM global_samples WHERE shelf_id IS NOT NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RESUMEN MIGRATION 004';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Relaciones shelf_suppliers: %', shelf_suppliers_count;
    RAISE NOTICE 'Anaqueles con shelf_type: %', shelves_with_type;
    RAISE NOTICE 'Muestras bulk con ubicación: %', global_with_location;
    RAISE NOTICE '========================================';
END $$;
