-- Migration 003: OBSOLETA - Redundante con Migration 002
-- Fecha: 2026-04-07
-- 
-- ⚠️  ESTA MIGRACIÓN HA SIDO MARCADA COMO OBSOLETA
-- ⚠️  NO EJECUTAR - Su funcionalidad está incluida en migration-002-3d-support.sql
--
-- Esta migración fue creada para agregar columnas 'depth' y 'shelf_depth' pero
-- migration-002 ya incluye esta funcionalidad con mejoras adicionales.
--
-- Si por alguna razón necesita ejecutar esta migración de forma independiente,
-- primero verifique que migration-002 no se haya ejecutado ya.

DO $$
BEGIN
    RAISE NOTICE '⚠️  Migration 003 está OBSOLETA. No se ejecutará ninguna acción.';
    RAISE NOTICE '⚠️  Use migration-002-3d-support.sql en su lugar.';
END $$;
