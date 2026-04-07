-- Migration 005: Corregir total_capacity para incluir shelf_depth
-- Fecha: 2026-04-07
-- 
-- DEPENDENCIAS: Migration 002 (shelf_depth debe existir)
-- PROBLEMA: total_capacity es GENERATED COLUMN con expresión (grid_width * grid_height)
--           pero NO incluye shelf_depth, lo que da capacidades incorrectas para 3D
--
-- SOLUCIÓN: Recrear la columna generada con la expresión correcta

-- ==========================================
-- VERIFICACIÓN DE DEPENDENCIAS
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shelves' AND column_name = 'shelf_depth'
    ) THEN
        RAISE EXCEPTION '❌ Columna shelf_depth no existe. Ejecute migration-002 primero.';
    END IF;
    RAISE NOTICE '✅ Dependencias verificadas correctamente';
END $$;

-- ==========================================
-- PASO 1: Verificar el estado actual de total_capacity
-- ==========================================
DO $$
DECLARE
    current_expression TEXT;
BEGIN
    SELECT generation_expression INTO current_expression
    FROM information_schema.columns 
    WHERE table_name = 'shelves' AND column_name = 'total_capacity';
    
    RAISE NOTICE '📊 Expresión actual de total_capacity: %', current_expression;
    
    IF current_expression LIKE '%shelf_depth%' THEN
        RAISE NOTICE '✅ total_capacity ya incluye shelf_depth. No se requiere acción.';
        RETURN;
    ELSE
        RAISE NOTICE '⚠️  total_capacity NO incluye shelf_depth. Se corregirá.';
    END IF;
END $$;

-- ==========================================
-- PASO 2: Recrear la columna generada
-- En PostgreSQL no se puede ALTER una columna generada directamente.
-- Debemos DROP y ADD nuevamente.
-- ==========================================

-- Primero, verificar si hay datos que podrían perderse
DO $$
DECLARE
    shelves_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO shelves_count FROM shelves;
    RAISE NOTICE '📊 Anaqueles existentes: %', shelves_count;
END $$;

-- Eliminar la columna generada actual
ALTER TABLE shelves DROP COLUMN IF EXISTS total_capacity;

-- Recrear con la expresión correcta 3D
ALTER TABLE shelves ADD COLUMN total_capacity INTEGER GENERATED ALWAYS AS (grid_width * grid_height * shelf_depth) STORED;

-- ==========================================
-- PASO 3: Verificar la corrección
-- ==========================================
DO $$
DECLARE
    new_expression TEXT;
BEGIN
    SELECT generation_expression INTO new_expression
    FROM information_schema.columns 
    WHERE table_name = 'shelves' AND column_name = 'total_capacity';
    
    RAISE NOTICE '✅ Nueva expresión de total_capacity: %', new_expression;
END $$;

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================
SELECT 
    id,
    name,
    grid_width,
    grid_height,
    shelf_depth,
    total_capacity,
    (grid_width * grid_height * shelf_depth) as expected_capacity
FROM shelves
LIMIT 10;
