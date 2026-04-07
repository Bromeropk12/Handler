-- Migration 001: Agregar tabla suppliers y relacionar con global_samples
-- Este script se ejecuta en bases de datos existentes que ya tienen datos
-- Fecha: 2026-04-07
-- 
-- DEPENDENCIAS: Ninguna (primera migración)
-- REQUISITOS: Tablas global_samples y shelves deben existir

-- ==========================================
-- VERIFICACIÓN DE DEPENDENCIAS
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_samples') THEN
        RAISE EXCEPTION '❌ Tabla global_samples no existe. Ejecute init.sql primero.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shelves') THEN
        RAISE EXCEPTION '❌ Tabla shelves no existe. Ejecute init.sql primero.';
    END IF;
    RAISE NOTICE '✅ Dependencias verificadas correctamente';
END $$;

-- ==========================================
-- PASO 1: Crear tabla suppliers si no existe
-- ==========================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    market_lines TEXT[],
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- PASO 2: Insertar proveedores principales de Handler
-- Se insertan primero los proveedores conocidos para evitar conflictos
-- ==========================================
INSERT INTO suppliers (name, market_lines) VALUES
('BASF', ARRAY['Cosmética', 'Industrial', 'Farmacéutica']),
('JRS', ARRAY['Cosmética']),
('THOR', ARRAY['Cosmética', 'Industrial']),
('JRF', ARRAY['Farmacéutica']),
('SUDEEP', ARRAY['Farmacéutica']),
('GIVAUDAN', ARRAY['Farmacéutica']),
('MEGGLE', ARRAY['Farmacéutica'])
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- PASO 3: Insertar proveedores adicionales desde datos existentes
-- Extrae los nombres únicos de provider de global_samples y shelves
-- Normaliza a mayúsculas para evitar duplicados por diferencias de case
-- ==========================================
INSERT INTO suppliers (name)
SELECT DISTINCT UPPER(TRIM(provider)) 
FROM global_samples 
WHERE provider IS NOT NULL AND TRIM(provider) != ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name)
SELECT DISTINCT UPPER(TRIM(provider)) 
FROM shelves 
WHERE provider IS NOT NULL AND TRIM(provider) != ''
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- PASO 4: Agregar columna supplier_id a global_samples
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'supplier_id'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
        RAISE NOTICE '✅ Columna supplier_id agregada a global_samples';
    ELSE
        RAISE NOTICE 'ℹ️  Columna supplier_id ya existe en global_samples';
    END IF;
END $$;

-- ==========================================
-- PASO 5: Migrar datos - mapear provider texto a supplier_id
-- Se usa UPPER(TRIM()) para manejar inconsistencias de formato
-- ==========================================
UPDATE global_samples gs
SET supplier_id = s.id
FROM suppliers s
WHERE UPPER(TRIM(gs.provider)) = s.name AND gs.supplier_id IS NULL;

-- Verificar cuántos registros no se pudieron mapear
DO $$
DECLARE
    unmapped_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM global_samples;
    SELECT COUNT(*) INTO unmapped_count FROM global_samples WHERE supplier_id IS NULL;
    
    IF unmapped_count > 0 THEN
        RAISE WARNING '⚠️  Hay % registros de % sin supplier_id mapeado. Revise los datos manualmente.', unmapped_count, total_count;
        RAISE WARNING '⚠️  Los proveedores no mapeados pueden tener nombres diferentes a los registrados.';
    ELSE
        RAISE NOTICE '✅ Todos los % registros tienen supplier_id asignado', total_count;
    END IF;
END $$;

-- ==========================================
-- PASO 6: Hacer supplier_id NOT NULL solo si todos los registros tienen valor
-- ==========================================
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM global_samples WHERE supplier_id IS NULL;
    IF null_count = 0 THEN
        ALTER TABLE global_samples ALTER COLUMN supplier_id SET NOT NULL;
        RAISE NOTICE '✅ supplier_id es ahora NOT NULL (todos los registros tienen valor)';
    ELSE
        RAISE WARNING '⚠️  supplier_id NO se hizo NOT NULL porque hay % registros sin valor', null_count;
        RAISE WARNING '⚠️  Puede hacer NOT NULL manualmente después de corregir los datos';
    END IF;
END $$;

-- ==========================================
-- PASO 7: Agregar columna position_z a dispensed_samples si no existe
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dispensed_samples') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'dispensed_samples' AND column_name = 'position_z'
        ) THEN
            ALTER TABLE dispensed_samples ADD COLUMN position_z INTEGER DEFAULT 0;
            RAISE NOTICE '✅ Columna position_z agregada a dispensed_samples';
        ELSE
            RAISE NOTICE 'ℹ️  Columna position_z ya existe en dispensed_samples';
        END IF;
    END IF;
END $$;

-- ==========================================
-- PASO 8: Agregar columnas de unidades a global_samples si no existen
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'total_units'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN total_units INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Columna total_units agregada a global_samples';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'available_units'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN available_units INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Columna available_units agregada a global_samples';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'weight_per_unit_grams'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN weight_per_unit_grams DECIMAL(10,2);
        RAISE NOTICE '✅ Columna weight_per_unit_grams agregada a global_samples';
    END IF;
END $$;

-- ==========================================
-- PASO 9: Agregar índices para performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_global_samples_supplier ON global_samples(supplier_id);
CREATE INDEX IF NOT EXISTS idx_dispensed_samples_position_3d ON dispensed_samples(shelf_id, position_x, position_y, position_z);

-- ==========================================
-- PASO 10: Agregar action_type password_reset si no existe
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum WHERE enumlabel = 'password_reset'
    ) THEN
        ALTER TYPE action_type ADD VALUE 'password_reset';
        RAISE NOTICE '✅ Action type password_reset agregado';
    END IF;
END $$;

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================
DO $$
DECLARE
    suppliers_count INTEGER;
    global_with_supplier INTEGER;
    global_without_supplier INTEGER;
BEGIN
    SELECT COUNT(*) INTO suppliers_count FROM suppliers;
    SELECT COUNT(*) INTO global_with_supplier FROM global_samples WHERE supplier_id IS NOT NULL;
    SELECT COUNT(*) INTO global_without_supplier FROM global_samples WHERE supplier_id IS NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RESUMEN MIGRATION 001';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Proveedores creados: %', suppliers_count;
    RAISE NOTICE 'Global samples con supplier_id: %', global_with_supplier;
    RAISE NOTICE 'Global samples sin supplier_id: %', global_without_supplier;
    RAISE NOTICE '========================================';
END $$;
