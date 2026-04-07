-- Migration 006: Fix action_type enum
-- Agregar valores faltantes 'updated' y 'deleted' al enum action_type
-- Estos valores son usados por samples/controller.js pero no existían en el enum

DO $$
BEGIN
    -- Agregar 'updated' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'updated' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type')
    ) THEN
        ALTER TYPE action_type ADD VALUE 'updated';
        RAISE NOTICE '✅ Valor "updated" agregado al enum action_type';
    ELSE
        RAISE NOTICE 'ℹ️  Valor "updated" ya existe en action_type';
    END IF;
END $$;

DO $$
BEGIN
    -- Agregar 'deleted' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'deleted' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type')
    ) THEN
        ALTER TYPE action_type ADD VALUE 'deleted';
        RAISE NOTICE '✅ Valor "deleted" agregado al enum action_type';
    ELSE
        RAISE NOTICE 'ℹ️  Valor "deleted" ya existe en action_type';
    END IF;
END $$;

-- Verificación
DO $$
DECLARE
    enum_values TEXT;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RESUMEN MIGRATION 006';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Valores action_type: %', enum_values;
    RAISE NOTICE '========================================';
END $$;
