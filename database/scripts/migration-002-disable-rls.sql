-- ============================================================================
-- migration-002: DISABLE Row Level Security (RLS) on local environment
-- ============================================================================
--
-- ⚠️  SECURITY DECLARATION — Read before relying on this migration.
--
-- The application's RLS policies are established in migration-001.
-- This migration DISABLES them on purpose, for the following reasons:
--
--   1. SIMPLICITY: the application enforces authn/authz entirely in code
--      (JWT + 47 granular permissions in `users.permissions` JSONB).
--
--   2. OPERATIONAL: local LAN deployments use a single Postgres user
--      (handler_user) that has full DML on the schema; per-row policies
--      would require defining policies for that role anyway.
--
-- ─── CONSEQUENCES ───
--
--   * Any direct query to the database with the app's credentials sees
--     ALL rows in ALL tables, regardless of which user the application
--     thinks is logged in. RLS is NOT a second line of defense here.
--
--   * If the backend has a broken access control bug (e.g. IDOR,
--     missing requirePermission), a direct dump of the database reveals
--     ALL data including password hashes.
--
--   * In multi-tenant or production deployments, this migration MUST
--     be reversed (or replaced with migration-003-enable-rls-prod.sql
--     that creates policies for the handler_user role).
--
-- If you are deploying outside of a single-tenant LAN, REVERT THIS
-- MIGRATION and add row-level policies. See the security audit
-- (Manual_Tecnico_Completo.md, section 4.2.2) for details.
--
-- DO NOT DELETE this migration from version control. It is intentionally
-- present to document the security posture of the local deployment.
-- ============================================================================

ALTER TABLE users             DISABLE ROW LEVEL SECURITY;
ALTER TABLE market_lines      DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers         DISABLE ROW LEVEL SECURITY;
ALTER TABLE shelves           DISABLE ROW LEVEL SECURITY;
ALTER TABLE shelf_suppliers   DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_samples    DISABLE ROW LEVEL SECURITY;
ALTER TABLE dispensed_samples DISABLE ROW LEVEL SECURITY;
ALTER TABLE movements         DISABLE ROW LEVEL SECURITY;
