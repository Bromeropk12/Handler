-- =============================================================================
-- HANDLER TRACKSAMPLES — SCHEMA COMPLETO DE PRODUCCIÓN
-- PostgreSQL 15+
-- Versión consolidada (init.sql + migraciones 001 a 010)
-- =============================================================================

-- Extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TIPOS ENUMERADOS
-- =============================================================================

CREATE TYPE danger_class AS ENUM (
  'Sin Riesgo',
  'Inflamable',
  'Corrosivo',
  'Toxico',
  'Comburente',
  'Explosivo'
);

CREATE TYPE sample_status AS ENUM (
  'stored',
  'dispatched',
  'expired'
);

CREATE TYPE dimensions AS ENUM (
  '1x1x1', '1x2x1', '2x1x1', '2x2x1',
  '1x1x2', '1x2x2', '2x1x2', '2x2x2'
);

-- action_type incluye todos los valores hasta migration-010
CREATE TYPE action_type AS ENUM (
  'created',
  'dispensed',
  'stored',
  'moved',
  'dispatched',
  'expired',
  'password_reset',
  'updated',
  'deleted',
  'user_created',
  'user_deleted',
  'admin_password_change',
  'permissions_updated',
  'permissions_set',
  'backup_created',
  'backup_restored'
);

CREATE TYPE user_role AS ENUM (
  'admin',
  'operator',
  'analyst'
);

-- =============================================================================
-- TABLA: users
-- Usuarios del sistema con autenticación JWT, doble contraseña y permisos JSONB
-- =============================================================================
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username              VARCHAR(50)  UNIQUE NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  secret_password_hash  VARCHAR(255) NOT NULL,
  role                  user_role    NOT NULL DEFAULT 'operator',
  -- Permisos granulares por usuario (migration-009)
  permissions           JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  users IS 'Usuarios del sistema con autenticación JWT y contraseña secreta de recuperación';
COMMENT ON COLUMN users.permissions IS 'Objeto JSONB con 47 permisos booleanos granulares por usuario';

-- Índice GIN para búsquedas eficientes sobre permisos
CREATE INDEX idx_users_permissions ON users USING GIN (permissions);

-- =============================================================================
-- TABLA: market_lines
-- Líneas de mercado que agrupan anaqueles y muestras
-- =============================================================================
CREATE TABLE market_lines (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE market_lines IS 'Líneas de mercado: Cosmética (5 anaqueles), Farmacéutica (6), Industrial (3)';

-- =============================================================================
-- TABLA: suppliers
-- Proveedores de materias primas químicas (migration-001 + migration-007)
-- =============================================================================
CREATE TABLE suppliers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) UNIQUE NOT NULL,
  -- Array de nombres de líneas de mercado que abastece (desnormalizado intencional)
  market_lines TEXT[],
  phone        VARCHAR(50),
  email        VARCHAR(255),
  address      TEXT,
  -- Logo del proveedor en carpeta recursos/ (migration-007)
  logo_path    VARCHAR(500),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  suppliers IS 'Proveedores de materias primas químicas (BASF, JRS, THOR, JRF, SUDEEP, GIVAUDAN, MEGGLE)';
COMMENT ON COLUMN suppliers.logo_path IS 'Ruta relativa al logo del proveedor en carpeta recursos/proveedores/';

-- =============================================================================
-- TABLA: shelves
-- Anaqueles físicos con grilla 3D configurable (migration-002, 004, 005)
-- =============================================================================
CREATE TABLE shelves (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_line_id  UUID         NOT NULL REFERENCES market_lines(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  -- Referencia visual al proveedor principal (texto, deprecado en favor de shelf_suppliers)
  provider        VARCHAR(100),
  -- Dimensiones de la grilla 3D
  grid_width      INTEGER      NOT NULL DEFAULT 10 CHECK (grid_width  > 0 AND grid_width  <= 50),  -- X: Columnas
  grid_height     INTEGER      NOT NULL DEFAULT 10 CHECK (grid_height > 0 AND grid_height <= 50),  -- Y: Niveles
  shelf_depth     INTEGER      NOT NULL DEFAULT 10 CHECK (shelf_depth > 0 AND shelf_depth <= 50),  -- Z: Profundidad
  shelf_type      VARCHAR(50)  NOT NULL DEFAULT 'storage' CHECK (shelf_type IN ('storage', 'bulk_temporary')),
  -- Capacidad calculada automáticamente (migration-005: expresión 3D correcta)
  total_capacity  INTEGER GENERATED ALWAYS AS (grid_width * grid_height * shelf_depth) STORED,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (market_line_id, name)
);

COMMENT ON TABLE  shelves IS 'Anaqueles físicos con grilla 3D (width × height × depth) organizados por línea de mercado y proveedor';
COMMENT ON COLUMN shelves.grid_width   IS 'Eje X — número de columnas del anaquel';
COMMENT ON COLUMN shelves.grid_height  IS 'Eje Y — número de niveles del anaquel';
COMMENT ON COLUMN shelves.shelf_depth  IS 'Eje Z — profundidad del anaquel';
COMMENT ON COLUMN shelves.shelf_type   IS 'storage = almacenamiento normal | bulk_temporary = zona temporal para muestras bulk';
COMMENT ON COLUMN shelves.total_capacity IS 'Capacidad total en celdas 3D (grid_width × grid_height × shelf_depth)';

-- =============================================================================
-- TABLA: shelf_suppliers
-- Relación M:N entre anaqueles y proveedores permitidos (migration-004)
-- =============================================================================
CREATE TABLE shelf_suppliers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shelf_id    UUID    NOT NULL REFERENCES shelves(id)    ON DELETE CASCADE,
  supplier_id UUID    NOT NULL REFERENCES suppliers(id)  ON DELETE CASCADE,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (shelf_id, supplier_id)
);

COMMENT ON TABLE  shelf_suppliers IS 'Relación muchos-a-muchos entre anaqueles y proveedores autorizados';
COMMENT ON COLUMN shelf_suppliers.is_primary IS 'true = proveedor principal del anaquel';

-- =============================================================================
-- TABLA: global_samples
-- Muestras bulk (recipiente original) con metadatos GHS completos
-- Acumula columnas de: init, migration-001, 002, 004, 007, 008
-- =============================================================================
CREATE TABLE global_samples (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(255) NOT NULL,
  -- Proveedor (referencia directa, reemplazó campo "provider" de texto)
  supplier_id       UUID         NOT NULL REFERENCES suppliers(id),
  -- Campo legado de texto; mantenido por compatibilidad (se deprecará)
  provider          VARCHAR(255),
  lot               VARCHAR(100) NOT NULL,
  expiration_date   DATE         NOT NULL,
  manufacture_date  DATE         NOT NULL,
  -- Clasificación GHS de peligro
  ghs_danger_class  danger_class NOT NULL,
  -- Pictogramas GHS adicionales (migration-007)
  ghs_pictograms    TEXT[]       NOT NULL DEFAULT '{}',
  -- Palabra de señal GHS (migration-007)
  signal_word       VARCHAR(20)  NOT NULL DEFAULT 'ATENCION' CHECK (signal_word IN ('PELIGRO', 'ATENCION')),
  -- Línea de mercado a la que pertenece
  market_line_id    UUID         NOT NULL REFERENCES market_lines(id) ON DELETE CASCADE,
  -- Dimensiones del recipiente bulk en la grilla 3D
  dimensions        dimensions   NOT NULL,
  -- Unidades disponibles (total al ingresar, disponible decrece con dispensaciones)
  total_units       INTEGER      NOT NULL DEFAULT 0 CHECK (total_units >= 0),
  available_units   INTEGER      NOT NULL DEFAULT 0 CHECK (available_units >= 0),
  -- Peso total del bulk en gramos (migration-007: renombrado de weight_per_unit_grams)
  total_weight_grams DECIMAL(10,2) NOT NULL CHECK (total_weight_grams > 0),
  -- Ubicación física del bulk en un anaquel (migration-004)
  shelf_id          UUID REFERENCES shelves(id),
  position_x        INTEGER CHECK (position_x >= 0),  -- Columna
  position_y        INTEGER CHECK (position_y >= 0),  -- Nivel
  position_z        INTEGER DEFAULT 0 CHECK (position_z >= 0),  -- Profundidad
  width             INTEGER DEFAULT 1,
  height            INTEGER DEFAULT 1,
  depth             INTEGER DEFAULT 1,
  -- Tamaño físico del frasco hijo para representación 3D (migration-008)
  dispensed_size    VARCHAR(20)  NOT NULL DEFAULT '1x1x1',
  -- Ruta al Certificate of Analysis PDF (puede ser ruta UNC de red)
  coa_file_path     VARCHAR(500),
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (manufacture_date <= expiration_date),
  CHECK (available_units  <= total_units)
);

COMMENT ON TABLE  global_samples IS 'Muestras globales (bulk) con metadatos GHS, CoA PDF y posición 3D en anaquel';
COMMENT ON COLUMN global_samples.ghs_pictograms   IS 'Array de códigos de pictogramas GHS aplicables a la muestra';
COMMENT ON COLUMN global_samples.signal_word      IS 'Palabra de señal GHS: PELIGRO o ATENCION';
COMMENT ON COLUMN global_samples.total_weight_grams IS 'Peso total del recipiente bulk en gramos';
COMMENT ON COLUMN global_samples.dispensed_size   IS 'Tamaño WxHxD del frasco hijo en el almacén 3D. Ej: 1x1x1, 2x1x1';
COMMENT ON COLUMN global_samples.coa_file_path    IS 'Ruta relativa o UNC al archivo PDF del Certificate of Analysis';

-- =============================================================================
-- TABLA: dispensed_samples
-- Submuestras individuales generadas por dispensación del bulk
-- Con QR único y posición 3D propia en el anaquel
-- =============================================================================
CREATE TABLE dispensed_samples (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Referencia a la muestra bulk de origen
  global_sample_id  UUID         NOT NULL REFERENCES global_samples(id) ON DELETE CASCADE,
  -- Código QR único (formato short code)
  qr_code           VARCHAR(500) UNIQUE NOT NULL,
  -- Datos completos del QR en formato JSON (id, lote, nombre, submuestra, peso_gramos)
  qr_data           JSONB,
  -- Peso de esta submuestra específica
  weight_grams      DECIMAL(8,2) NOT NULL CHECK (weight_grams > 0),
  status            sample_status NOT NULL DEFAULT 'stored',
  -- Ubicación 3D en el anaquel
  shelf_id          UUID REFERENCES shelves(id) ON DELETE SET NULL,
  position_x        INTEGER CHECK (position_x >= 0),
  position_y        INTEGER CHECK (position_y >= 0),
  position_z        INTEGER DEFAULT 0 CHECK (position_z >= 0),
  -- Ocupación volumétrica en la grilla 3D (1 o 2 celdas por eje)
  width             INTEGER NOT NULL DEFAULT 1 CHECK (width  >= 1 AND width  <= 2),
  height            INTEGER NOT NULL DEFAULT 1 CHECK (height >= 1 AND height <= 2),
  depth             INTEGER NOT NULL DEFAULT 1 CHECK (depth  >= 1 AND depth  <= 2),
  -- Dimensiones del frasco hijo como cadena (migration-007)
  child_dimensions  VARCHAR(10) DEFAULT '1x1x1',
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  dispatched_at     TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE  dispensed_samples IS 'Submuestras individuales derivadas del bulk con QR único, posición 3D y estado de ciclo de vida';
COMMENT ON COLUMN dispensed_samples.qr_code          IS 'Código QR único para identificación física de la submuestra';
COMMENT ON COLUMN dispensed_samples.qr_data          IS 'Datos JSON del QR: {id, lot, name, subsample_number, weight_grams}';
COMMENT ON COLUMN dispensed_samples.child_dimensions IS 'Dimensiones del frasco hijo como cadena WxHxD';

-- Índice único explícito en qr_code (migration-008)
CREATE UNIQUE INDEX dispensed_samples_qr_code_unique ON dispensed_samples(qr_code);

-- =============================================================================
-- TABLA: movements
-- Log de trazabilidad inmutable de todas las operaciones del sistema
-- =============================================================================
CREATE TABLE movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Referencia polimórfica: puede ser global_sample_id o dispensed_sample_id (null para acciones de sistema)
  sample_id   UUID,
  action_type action_type  NOT NULL,
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Contexto adicional de la operación en formato JSON libre
  details     JSONB,
  timestamp   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  movements IS 'Log completo e inmutable de trazabilidad de todas las operaciones del sistema';
COMMENT ON COLUMN movements.sample_id   IS 'Referencia polimórfica: ID de global_samples o dispensed_samples';
COMMENT ON COLUMN movements.action_type IS 'Tipo de acción registrada según el enum action_type';
COMMENT ON COLUMN movements.details     IS 'Contexto JSON libre: datos antes/después, cantidades, razón de la acción';

-- =============================================================================
-- ÍNDICES DE PERFORMANCE
-- =============================================================================

-- global_samples
CREATE INDEX idx_global_samples_market_line ON global_samples(market_line_id);
CREATE INDEX idx_global_samples_lot         ON global_samples(lot);
CREATE INDEX idx_global_samples_supplier    ON global_samples(supplier_id);
CREATE INDEX idx_global_samples_shelf       ON global_samples(shelf_id);
CREATE INDEX idx_global_samples_position    ON global_samples(shelf_id, position_x, position_y, position_z);
CREATE INDEX idx_global_samples_pictograms  ON global_samples USING GIN (ghs_pictograms);

-- dispensed_samples
CREATE INDEX idx_dispensed_samples_global_sample ON dispensed_samples(global_sample_id);
CREATE INDEX idx_dispensed_samples_qr            ON dispensed_samples(qr_code);
CREATE INDEX idx_dispensed_samples_shelf         ON dispensed_samples(shelf_id);
CREATE INDEX idx_dispensed_samples_status        ON dispensed_samples(status);
CREATE INDEX idx_dispensed_samples_position      ON dispensed_samples(shelf_id, position_x, position_y, position_z);

-- shelves
CREATE INDEX idx_shelves_market_line ON shelves(market_line_id);
CREATE INDEX idx_shelves_provider    ON shelves(provider);

-- movements
CREATE INDEX idx_movements_sample    ON movements(sample_id);
CREATE INDEX idx_movements_timestamp ON movements(timestamp);
CREATE INDEX idx_movements_user      ON movements(user_id);
CREATE INDEX idx_movements_action    ON movements(action_type);

-- shelf_suppliers
CREATE INDEX idx_shelf_suppliers_shelf    ON shelf_suppliers(shelf_id);
CREATE INDEX idx_shelf_suppliers_supplier ON shelf_suppliers(supplier_id);

-- =============================================================================
-- FUNCIÓN Y TRIGGER: updated_at automático
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_market_lines_updated_at
  BEFORE UPDATE ON market_lines
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_shelves_updated_at
  BEFORE UPDATE ON shelves
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_global_samples_updated_at
  BEFORE UPDATE ON global_samples
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_dispensed_samples_updated_at
  BEFORE UPDATE ON dispensed_samples
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_lines      ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelves           ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelf_suppliers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_samples    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispensed_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements         ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- DATOS INICIALES — LÍNEAS DE MERCADO
-- =============================================================================
INSERT INTO market_lines (name) VALUES
  ('Cosmética'),
  ('Farmacéutica'),
  ('Industrial');

-- =============================================================================
-- DATOS INICIALES — PROVEEDORES
-- =============================================================================
INSERT INTO suppliers (name, market_lines, logo_path) VALUES
  ('BASF',     ARRAY['Cosmética','Industrial','Farmacéutica'], 'recursos/proveedores/BASF-1-500x500.png'),
  ('JRS',      ARRAY['Cosmética'],                             'recursos/proveedores/JRS-2-500x500.png'),
  ('THOR',     ARRAY['Cosmética','Industrial'],                'recursos/proveedores/THOR-1-500x500.png'),
  ('JRF',      ARRAY['Farmacéutica'],                         NULL),
  ('SUDEEP',   ARRAY['Farmacéutica'],                         'recursos/proveedores/SUDEEP-500x500.png'),
  ('GIVAUDAN', ARRAY['Farmacéutica'],                         'recursos/proveedores/GIVAUDAN-500x500.png'),
  ('MEGGLE',   ARRAY['Farmacéutica'],                         'recursos/proveedores/MEGGLE-1-500x500.png');

-- =============================================================================
-- DATOS INICIALES — ANAQUELES (14 anaqueles físicos)
-- =============================================================================

-- Cosmética: 5 anaqueles
INSERT INTO shelves (market_line_id, name, provider, grid_width, grid_height, shelf_depth, shelf_type) VALUES
  ((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'BASF #1', 'BASF', 10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'BASF #2', 'BASF', 10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'BASF #3', 'BASF', 10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'JRS #1',  'JRS',  10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'THOR #1', 'THOR', 10, 10, 10, 'storage');

-- Industrial: 3 anaqueles
INSERT INTO shelves (market_line_id, name, provider, grid_width, grid_height, shelf_depth, shelf_type) VALUES
  ((SELECT id FROM market_lines WHERE name = 'Industrial'), 'BASF #1',  'BASF',       10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Industrial'), 'MIXTO #1', 'BASF & THOR',10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Industrial'), 'BULK #1',  'BULK',        10, 10, 10, 'bulk_temporary');

-- Farmacéutica: 6 anaqueles
INSERT INTO shelves (market_line_id, name, provider, grid_width, grid_height, shelf_depth, shelf_type) VALUES
  ((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'JRF #1',   'JRF',              10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'JRF #2',   'JRF',              10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'MIXTO #1', 'SUDEEP & GIVAUDAN',10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'BASF #1',  'BASF',             10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'BASF #2',  'BASF',             10, 10, 10, 'storage'),
  ((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'MEGGLE #1','MEGGLE',           10, 10, 10, 'storage');

-- =============================================================================
-- DATOS INICIALES — RELACIONES ANAQUEL-PROVEEDOR (shelf_suppliers)
-- =============================================================================
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s
JOIN suppliers sup ON sup.name = SPLIT_PART(s.provider, ' ', 1)
WHERE s.provider IS NOT NULL
  AND s.provider NOT LIKE '%&%'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- =============================================================================
-- DATOS INICIALES — USUARIO ADMINISTRADOR
-- Contraseña: admin123 | Contraseña secreta: admin123
-- CAMBIAR EN PRODUCCIÓN REAL
-- =============================================================================
INSERT INTO users (username, password_hash, secret_password_hash, role, permissions)
VALUES (
  'admin',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  '{
    "dashboard.view": true,
    "samples.view": true, "samples.create": true, "samples.edit": true,
    "samples.delete": true, "samples.export": true, "samples.view_coa": true,
    "dispensing.view": true, "dispensing.create": true, "dispensing.reassign": true,
    "dispatch.view": true, "dispatch.execute": true, "dispatch.fefo": true,
    "warehouse.view": true, "warehouse.create_shelf": true, "warehouse.edit_shelf": true,
    "warehouse.delete_shelf": true, "warehouse.place_sample": true,
    "warehouse.move_sample": true, "warehouse.remove_sample": true,
    "warehouse.defragment": true,
    "movements.view": true, "movements.export": true,
    "suppliers.view": true, "suppliers.create": true, "suppliers.edit": true, "suppliers.delete": true,
    "market_lines.view": true, "market_lines.create": true, "market_lines.edit": true, "market_lines.delete": true,
    "alerts.view": true,
    "reports.view": true
  }'::jsonb
);

-- =============================================================================
-- VISTAS ÚTILES PARA CONSULTAS FRECUENTES
-- =============================================================================

-- Vista: Estado actual del inventario por línea de mercado
CREATE OR REPLACE VIEW v_inventory_summary AS
SELECT
  ml.name                                          AS market_line,
  COUNT(gs.id)                                     AS total_bulk_samples,
  SUM(gs.total_units)                              AS total_units,
  SUM(gs.available_units)                          AS available_units,
  SUM(gs.total_units - gs.available_units)         AS dispensed_units,
  COUNT(gs.id) FILTER (WHERE gs.expiration_date < CURRENT_DATE)          AS expired_count,
  COUNT(gs.id) FILTER (WHERE gs.expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS expiring_soon_count
FROM market_lines ml
LEFT JOIN global_samples gs ON gs.market_line_id = ml.id
GROUP BY ml.id, ml.name
ORDER BY ml.name;

COMMENT ON VIEW v_inventory_summary IS 'Resumen de inventario agrupado por línea de mercado con alertas de vencimiento';

-- Vista: Ocupación de anaqueles
CREATE OR REPLACE VIEW v_shelf_occupancy AS
SELECT
  s.id,
  s.name                                           AS shelf_name,
  ml.name                                          AS market_line,
  s.shelf_type,
  s.total_capacity,
  (
    SELECT COALESCE(SUM(ds.width * ds.height * ds.depth), 0)
    FROM dispensed_samples ds
    WHERE ds.shelf_id = s.id AND ds.status = 'stored'
  ) +
  (
    SELECT COALESCE(SUM(gs.width * gs.height * gs.depth), 0)
    FROM global_samples gs
    WHERE gs.shelf_id = s.id
  )                                                AS occupied_cells,
  s.total_capacity - (
    SELECT COALESCE(SUM(ds.width * ds.height * ds.depth), 0)
    FROM dispensed_samples ds
    WHERE ds.shelf_id = s.id AND ds.status = 'stored'
  ) -
  (
    SELECT COALESCE(SUM(gs.width * gs.height * gs.depth), 0)
    FROM global_samples gs
    WHERE gs.shelf_id = s.id
  )                                                AS free_cells
FROM shelves s
JOIN market_lines ml ON ml.id = s.market_line_id
ORDER BY ml.name, s.name;

COMMENT ON VIEW v_shelf_occupancy IS 'Ocupación real de cada anaquel: celdas totales, ocupadas y libres';

-- Vista: Muestras próximas a vencer (próximos 30 días)
CREATE OR REPLACE VIEW v_expiring_samples AS
SELECT
  gs.id,
  gs.name,
  gs.lot,
  sup.name                                         AS supplier,
  ml.name                                          AS market_line,
  gs.expiration_date,
  (gs.expiration_date - CURRENT_DATE)              AS days_until_expiry,
  gs.available_units,
  CASE
    WHEN gs.expiration_date < CURRENT_DATE         THEN 'VENCIDA'
    WHEN gs.expiration_date <= CURRENT_DATE + 7    THEN 'CRÍTICA'
    WHEN gs.expiration_date <= CURRENT_DATE + 30   THEN 'PRÓXIMA'
    ELSE 'OK'
  END                                              AS alert_level
FROM global_samples gs
JOIN suppliers   sup ON sup.id = gs.supplier_id
JOIN market_lines ml  ON ml.id  = gs.market_line_id
WHERE gs.expiration_date <= CURRENT_DATE + 30
ORDER BY gs.expiration_date ASC;

COMMENT ON VIEW v_expiring_samples IS 'Muestras vencidas o próximas a vencer en los próximos 30 días con nivel de alerta';

-- Vista: Trazabilidad completa con nombres descriptivos
CREATE OR REPLACE VIEW v_movements_detail AS
SELECT
  m.id,
  m.timestamp,
  m.action_type,
  u.username,
  u.role                                           AS user_role,
  m.sample_id,
  m.details
FROM movements m
JOIN users u ON u.id = m.user_id
ORDER BY m.timestamp DESC;

COMMENT ON VIEW v_movements_detail IS 'Log de movimientos enriquecido con datos del usuario';

-- =============================================================================
-- FIN DEL SCHEMA
-- Handler TrackSamples v1.0 — Producción
-- =============================================================================
