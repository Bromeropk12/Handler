-- Migration 010: Agregar valores de auditoría al enum action_type
-- Necesarios para el sistema de permisos y gestión de usuarios

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user_created' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type')) THEN
        ALTER TYPE action_type ADD VALUE 'user_created';
        RAISE NOTICE 'Valor "user_created" agregado';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'user_deleted' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type')) THEN
        ALTER TYPE action_type ADD VALUE 'user_deleted';
        RAISE NOTICE 'Valor "user_deleted" agregado';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_password_change' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type')) THEN
        ALTER TYPE action_type ADD VALUE 'admin_password_change';
        RAISE NOTICE 'Valor "admin_password_change" agregado';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'permissions_updated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type')) THEN
        ALTER TYPE action_type ADD VALUE 'permissions_updated';
        RAISE NOTICE 'Valor "permissions_updated" agregado';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'permissions_set' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type')) THEN
        ALTER TYPE action_type ADD VALUE 'permissions_set';
        RAISE NOTICE 'Valor "permissions_set" agregado';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'backup_created' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type')) THEN
        ALTER TYPE action_type ADD VALUE 'backup_created';
        RAISE NOTICE 'Valor "backup_created" agregado';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'backup_restored' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type')) THEN
        ALTER TYPE action_type ADD VALUE 'backup_restored';
        RAISE NOTICE 'Valor "backup_restored" agregado';
    END IF;
END $$;

DO $$
DECLARE enum_values TEXT;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'action_type');
    RAISE NOTICE 'Valores actuales de action_type: %', enum_values;
END $$;
