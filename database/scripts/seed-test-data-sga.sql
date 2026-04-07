-- Script de Datos de Prueba - Sistema Globalmente Armonizado
-- Fecha: 2026-04-07
-- 
-- Este script inserta datos de prueba realistas basados en productos químicos
-- comunes de Handler S.A.S. para verificar el funcionamiento del algoritmo SGA
-- y el sistema de ubicación automática.

-- ==========================================
-- VERIFICACIÓN DE DEPENDENCIAS
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_samples') THEN
        RAISE EXCEPTION '❌ Tabla global_samples no existe. Ejecute init.sql primero.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        RAISE EXCEPTION '❌ Tabla suppliers no existe. Ejecute migration-001 primero.';
    END IF;
    RAISE NOTICE '✅ Dependencias verificadas correctamente';
END $$;

-- ==========================================
-- PASO 1: Insertar muestras globales de prueba
-- Con diferentes clases de peligro SGA para probar compatibilidad
-- ==========================================

-- Muestra 1: Sin Riesgo (BASF - Cosmética)
INSERT INTO global_samples (
    name, supplier_id, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions,
    total_units, available_units, weight_per_unit_grams
)
SELECT 
    'Cetiol HE (Emoliente)', s.id, 'BASF-2024-001',
    '2027-06-30', '2024-01-15',
    'Sin Riesgo', ml.id, '1x1x1',
    50, 50, 100.00
FROM suppliers s, market_lines ml
WHERE s.name = 'BASF' AND ml.name = 'Cosmética'
ON CONFLICT DO NOTHING;

-- Muestra 2: Inflamable (BASF - Cosmética)
INSERT INTO global_samples (
    name, supplier_id, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions,
    total_units, available_units, weight_per_unit_grams
)
SELECT 
    'Ethanol Absolute', s.id, 'BASF-2024-002',
    '2026-12-31', '2024-03-01',
    'Inflamable', ml.id, '1x1x1',
    30, 30, 250.00
FROM suppliers s, market_lines ml
WHERE s.name = 'BASF' AND ml.name = 'Cosmética'
ON CONFLICT DO NOTHING;

-- Muestra 3: Corrosivo (THOR - Industrial)
INSERT INTO global_samples (
    name, supplier_id, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions,
    total_units, available_units, weight_per_unit_grams
)
SELECT 
    'Acido Clorhidrico 37%', s.id, 'THOR-2024-001',
    '2027-03-15', '2024-02-01',
    'Corrosivo', ml.id, '2x1x1',
    20, 20, 500.00
FROM suppliers s, market_lines ml
WHERE s.name = 'THOR' AND ml.name = 'Industrial'
ON CONFLICT DO NOTHING;

-- Muestra 4: Toxico (JRF - Farmacéutica)
INSERT INTO global_samples (
    name, supplier_id, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions,
    total_units, available_units, weight_per_unit_grams
)
SELECT 
    'Metanol HPLC Grade', s.id, 'JRF-2024-001',
    '2026-09-30', '2024-01-10',
    'Toxico', ml.id, '1x1x1',
    15, 15, 100.00
FROM suppliers s, market_lines ml
WHERE s.name LIKE 'JRF%' AND ml.name = 'Farmacéutica'
ON CONFLICT DO NOTHING;

-- Muestra 5: Comburente (BASF - Industrial)
INSERT INTO global_samples (
    name, supplier_id, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions,
    total_units, available_units, weight_per_unit_grams
)
SELECT 
    'Peróxido de Hidrógeno 30%', s.id, 'BASF-2024-003',
    '2026-08-15', '2024-04-01',
    'Comburente', ml.id, '1x2x1',
    25, 25, 200.00
FROM suppliers s, market_lines ml
WHERE s.name = 'BASF' AND ml.name = 'Industrial'
ON CONFLICT DO NOTHING;

-- Muestra 6: Sin Riesgo (JRS - Cosmética)
INSERT INTO global_samples (
    name, supplier_id, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions,
    total_units, available_units, weight_per_unit_grams
)
SELECT 
    'Vivapur MCC 101', s.id, 'JRS-2024-001',
    '2028-01-31', '2024-02-15',
    'Sin Riesgo', ml.id, '1x1x1',
    40, 40, 150.00
FROM suppliers s, market_lines ml
WHERE s.name LIKE 'JRS%' AND ml.name = 'Cosmética'
ON CONFLICT DO NOTHING;

-- Muestra 7: Inflamable (THOR - Cosmética)
INSERT INTO global_samples (
    name, supplier_id, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions,
    total_units, available_units, weight_per_unit_grams
)
SELECT 
    'Isopropil Alcohol 99%', s.id, 'THOR-2024-002',
    '2026-11-30', '2024-05-01',
    'Inflamable', ml.id, '1x1x1',
    35, 35, 300.00
FROM suppliers s, market_lines ml
WHERE s.name = 'THOR' AND ml.name = 'Cosmética'
ON CONFLICT DO NOTHING;

-- Muestra 8: Sin Riesgo (MEGGLE - Farmacéutica)
INSERT INTO global_samples (
    name, supplier_id, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions,
    total_units, available_units, weight_per_unit_grams
)
SELECT 
    'Lactosa Monohidratada', s.id, 'MEGGLE-2024-001',
    '2027-12-31', '2024-06-01',
    'Sin Riesgo', ml.id, '2x2x1',
    60, 60, 500.00
FROM suppliers s, market_lines ml
WHERE s.name = 'MEGGLE' AND ml.name = 'Farmacéutica'
ON CONFLICT DO NOTHING;

-- Muestra 9: Toxico (SUDEEP - Farmacéutica)
INSERT INTO global_samples (
    name, supplier_id, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions,
    total_units, available_units, weight_per_unit_grams
)
SELECT 
    'Cloruro de Metileno', s.id, 'SUDEEP-2024-001',
    '2026-07-31', '2024-03-15',
    'Toxico', ml.id, '1x1x1',
    10, 10, 250.00
FROM suppliers s, market_lines ml
WHERE s.name = 'SUDEEP' AND ml.name = 'Farmacéutica'
ON CONFLICT DO NOTHING;

-- Muestra 10: Inflamable (GIVAUDAN - Farmacéutica)
INSERT INTO global_samples (
    name, supplier_id, lot, expiration_date, manufacture_date,
    ghs_danger_class, market_line_id, dimensions,
    total_units, available_units, weight_per_unit_grams
)
SELECT 
    'Acido Acetico Glacial', s.id, 'GIVAUDAN-2024-001',
    '2027-04-30', '2024-04-20',
    'Inflamable', ml.id, '1x1x1',
    20, 20, 100.00
FROM suppliers s, market_lines ml
WHERE s.name = 'GIVAUDAN' AND ml.name = 'Farmacéutica'
ON CONFLICT DO NOTHING;

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================
DO $$
DECLARE
    total_samples INTEGER;
    samples_by_class RECORD;
BEGIN
    SELECT COUNT(*) INTO total_samples FROM global_samples;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RESUMEN DATOS DE PRUEBA SGA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total muestras globales: %', total_samples;
    RAISE NOTICE '';
    RAISE NOTICE 'Muestras por clase de peligro:';
    
    FOR samples_by_class IN 
        SELECT ghs_danger_class, COUNT(*) as count
        FROM global_samples
        GROUP BY ghs_danger_class
        ORDER BY ghs_danger_class
    LOOP
        RAISE NOTICE '  - %: %', samples_by_class.ghs_danger_class, samples_by_class.count;
    END LOOP;
    
    RAISE NOTICE '========================================';
END $$;
