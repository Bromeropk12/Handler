-- Migration 001: Agregar tabla suppliers y relacionar con global_samples
-- Este script se ejecuta en bases de datos existentes que ya tienen datos
-- Fecha: 2026-04-05

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
-- PASO 2: Insertar proveedores desde datos existentes
-- Extrae los nombres únicos de provider de global_samples y shelves
-- ==========================================
INSERT INTO suppliers (name)
SELECT DISTINCT provider 
FROM global_samples 
WHERE provider IS NOT NULL AND provider != ''
ON CONFLICT (name) DO NOTHING;

-- También extraer de shelves
INSERT INTO suppliers (name)
SELECT DISTINCT provider 
FROM shelves 
WHERE provider IS NOT NULL AND provider != ''
ON CONFLICT (name) DO NOTHING;

-- Insertar proveedores principales de Handler si no existen
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
-- PASO 3: Agregar columna supplier_id a global_samples
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'supplier_id'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
    END IF;
END $$;

-- ==========================================
-- PASO 4: Migrar datos - mapear provider texto a supplier_id
-- ==========================================
UPDATE global_samples gs
SET supplier_id = s.id
FROM suppliers s
WHERE gs.provider = s.name AND gs.supplier_id IS NULL;

-- ==========================================
-- PASO 5: Hacer supplier_id NOT NULL después de migrar
-- (Solo si todos los registros tienen supplier_id)
-- ==========================================
-- Primero verificar que no haya registros sin supplier_id
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM global_samples WHERE supplier_id IS NULL;
    IF null_count > 0 THEN
        RAISE NOTICE 'Hay % registros sin supplier_id. Revise los datos manualmente.', null_count;
    ELSE
        -- Si todos tienen supplier_id, hacer NOT NULL
        ALTER TABLE global_samples ALTER COLUMN supplier_id SET NOT NULL;
        RAISE NOTICE 'Migración completada exitosamente. supplier_id es ahora NOT NULL.';
    END IF;
END $$;

-- ==========================================
-- PASO 6: Agregar columna position_z a dispensed_samples si no existe
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dispensed_samples' AND column_name = 'position_z'
    ) THEN
        ALTER TABLE dispensed_samples ADD COLUMN position_z INTEGER DEFAULT 0;
    END IF;
END $$;

-- ==========================================
-- PASO 7: Agregar columnas de unidades a global_samples si no existen
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'total_units'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN total_units INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'available_units'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN available_units INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'global_samples' AND column_name = 'weight_per_unit_grams'
    ) THEN
        ALTER TABLE global_samples ADD COLUMN weight_per_unit_grams DECIMAL(10,2);
    END IF;
END $$;

-- ==========================================
-- PASO 8: Agregar índices para performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_global_samples_supplier ON global_samples(supplier_id);
CREATE INDEX IF NOT EXISTS idx_dispensed_samples_position_3d ON dispensed_samples(shelf_id, position_x, position_y, position_z);

-- ==========================================
-- PASO 9: Agregar action_type password_reset si no existe
-- ==========================================
DO $$
BEGIN
    -- Verificar si el tipo ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum WHERE enumlabel = 'password_reset'
    ) THEN
        ALTER TYPE action_type ADD VALUE 'password_reset';
    END IF;
END $$;

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================
SELECT 
    'suppliers' as table_name, 
    COUNT(*) as total 
FROM suppliers
UNION ALL
SELECT 
    'global_samples con supplier_id', 
    COUNT(*) 
FROM global_samples WHERE supplier_id IS NOT NULL
UNION ALL
SELECT 
    'global_samples sin supplier_id', 
    COUNT(*) 
FROM global_samples WHERE supplier_id IS NULL;
