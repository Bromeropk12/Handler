-- Handler TrackSamples Database Initialization
-- PostgreSQL Script for creating all tables with UUIDs and timestamps

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE danger_class AS ENUM ('Sin Riesgo', 'Inflamable', 'Corrosivo', 'Toxico', 'Comburente', 'Explosivo');
CREATE TYPE sample_status AS ENUM ('stored', 'dispatched', 'expired');
-- Dimensiones 3D: Ancho(X) × Alto(Y) × Profundidad(Z)
CREATE TYPE dimensions AS ENUM (
  '1x1x1', '1x2x1', '2x1x1', '2x2x1',
  '1x1x2', '1x2x2', '2x1x2', '2x2x2'
);
CREATE TYPE action_type AS ENUM ('created', 'dispensed', 'stored', 'moved', 'dispatched', 'expired', 'password_reset', 'updated', 'deleted');
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'analyst');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    secret_password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'operator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market lines table
CREATE TABLE market_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table (Proveedores)
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    market_lines TEXT[], -- Array de líneas de mercado que abastece
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shelves table (Anaqueles) - Grid 3D: X=Columna, Y=Nivel, Z=Profundidad
CREATE TABLE shelves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_line_id UUID NOT NULL REFERENCES market_lines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(100), -- BASF, JRS, THOR, MEGGLE, etc. (referencia visual al proveedor)
    grid_width INTEGER NOT NULL DEFAULT 10 CHECK (grid_width > 0 AND grid_width <= 50),      -- X: Columnas
    grid_height INTEGER NOT NULL DEFAULT 10 CHECK (grid_height > 0 AND grid_height <= 50),    -- Y: Niveles
    shelf_depth INTEGER NOT NULL DEFAULT 10 CHECK (shelf_depth > 0 AND shelf_depth <= 50),    -- Z: Profundidad
    shelf_type VARCHAR(50) DEFAULT 'storage' CHECK (shelf_type IN ('storage', 'bulk_temporary')),
    total_capacity INTEGER GENERATED ALWAYS AS (grid_width * grid_height * shelf_depth) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(market_line_id, name)
);

-- Shelf Suppliers (Relación muchos a muchos para anaqueles y proveedores permitidos)
CREATE TABLE shelf_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shelf_id UUID NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    UNIQUE(shelf_id, supplier_id)
);

-- Global samples table (Muestras Bulk)
CREATE TABLE global_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    provider VARCHAR(255), -- Mantenido por compatibilidad, se deprecará
    lot VARCHAR(100) NOT NULL,
    expiration_date DATE NOT NULL,
    manufacture_date DATE NOT NULL,
    ghs_danger_class danger_class NOT NULL,
    market_line_id UUID NOT NULL REFERENCES market_lines(id) ON DELETE CASCADE,
    dimensions dimensions NOT NULL,
    total_units INTEGER NOT NULL DEFAULT 0 CHECK (total_units >= 0),
    available_units INTEGER NOT NULL DEFAULT 0 CHECK (available_units >= 0),
    weight_per_unit_grams DECIMAL(10,2) NOT NULL CHECK (weight_per_unit_grams > 0),
    shelf_id UUID REFERENCES shelves(id),
    position_x INTEGER,
    position_y INTEGER,
    position_z INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    depth INTEGER DEFAULT 1,
    coa_file_path VARCHAR(500), -- Ruta al archivo CoA PDF del bulk (puede ser ruta UNC de red)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (manufacture_date <= expiration_date),
    CHECK (available_units <= total_units)
);

-- Dispensed samples table (Muestras Individuales) - Posición 3D
CREATE TABLE dispensed_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    global_sample_id UUID NOT NULL REFERENCES global_samples(id) ON DELETE CASCADE,
    qr_code VARCHAR(500) UNIQUE NOT NULL,
    qr_data JSONB, -- Datos del QR (id, lote, nombre, submuestra, peso_gramos)
    weight_grams DECIMAL(8,2) NOT NULL CHECK (weight_grams > 0),
    status sample_status DEFAULT 'stored',
    shelf_id UUID REFERENCES shelves(id) ON DELETE SET NULL,
    position_x INTEGER, -- Columna (eje X)
    position_y INTEGER, -- Nivel (eje Y)
    position_z INTEGER DEFAULT 0, -- Profundidad (eje Z)
    width INTEGER NOT NULL DEFAULT 1 CHECK (width >= 1 AND width <= 2),   -- Ocupación en X
    height INTEGER NOT NULL DEFAULT 1 CHECK (height >= 1 AND height <= 2), -- Ocupación en Y
    depth INTEGER NOT NULL DEFAULT 1 CHECK (depth >= 1 AND depth <= 2),    -- Ocupación en Z
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    CHECK (position_x >= 0),
    CHECK (position_y >= 0),
    CHECK (position_z >= 0)
);

-- Movements table (Trazabilidad)
CREATE TABLE movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID NOT NULL, -- Polymorphic reference
    action_type action_type NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    details JSONB, -- Additional context for the action
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_global_samples_market_line ON global_samples(market_line_id);
CREATE INDEX idx_global_samples_lot ON global_samples(lot);
CREATE INDEX idx_global_samples_supplier ON global_samples(supplier_id);
CREATE INDEX idx_global_samples_shelf ON global_samples(shelf_id);
CREATE INDEX idx_global_samples_position ON global_samples(shelf_id, position_x, position_y, position_z);
CREATE INDEX idx_dispensed_samples_global_sample ON dispensed_samples(global_sample_id);
CREATE INDEX idx_dispensed_samples_qr ON dispensed_samples(qr_code);
CREATE INDEX idx_dispensed_samples_shelf ON dispensed_samples(shelf_id);
CREATE INDEX idx_dispensed_samples_status ON dispensed_samples(status);
CREATE INDEX idx_dispensed_samples_position ON dispensed_samples(shelf_id, position_x, position_y, position_z);
CREATE INDEX idx_shelves_market_line ON shelves(market_line_id);
CREATE INDEX idx_shelves_provider ON shelves(provider);
CREATE INDEX idx_movements_sample ON movements(sample_id);
CREATE INDEX idx_movements_timestamp ON movements(timestamp);
CREATE INDEX idx_movements_user ON movements(user_id);

-- Insert initial data
INSERT INTO market_lines (name) VALUES
('Cosmética'),
('Farmacéutica'),
('Industrial');

-- Insert initial suppliers (proveedores principales de Handler)
INSERT INTO suppliers (name, market_lines, phone, email, address) VALUES
('BASF', ARRAY['Cosmética', 'Industrial', 'Farmacéutica'], NULL, NULL, NULL),
('JRS', ARRAY['Cosmética'], NULL, NULL, NULL),
('THOR', ARRAY['Cosmética', 'Industrial'], NULL, NULL, NULL),
('JRF', ARRAY['Farmacéutica'], NULL, NULL, NULL),
('SUDEEP', ARRAY['Farmacéutica'], NULL, NULL, NULL),
('GIVAUDAN', ARRAY['Farmacéutica'], NULL, NULL, NULL),
('MEGGLE', ARRAY['Farmacéutica'], NULL, NULL, NULL);

-- Insert shelves according to company distribution (con profundidad 3D)
-- Cosmética: 5 anaqueles (3 BASF, 1 JRS, 1 THOR)
INSERT INTO shelves (market_line_id, name, provider, grid_width, grid_height, shelf_depth) VALUES
((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'BASF #1', 'BASF', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'BASF #2', 'BASF', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'BASF #3', 'BASF', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'JRS #1', 'JRS', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'THOR #1', 'THOR', 10, 10, 10);

-- Industrial: 3 anaqueles (1 BASF, 1 BASF & THOR Mixto, 1 BULK)
INSERT INTO shelves (market_line_id, name, provider, grid_width, grid_height, shelf_depth) VALUES
((SELECT id FROM market_lines WHERE name = 'Industrial'), 'BASF #1', 'BASF', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Industrial'), 'MIXTO #1', 'BASF & THOR', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Industrial'), 'BULK #1', 'BULK', 10, 10, 10);

-- Farmacéutica: 6 anaqueles (2 JRF, 1 SUDEEP & GIVAUDAN Mixto, 2 BASF, 1 MEGGLE)
INSERT INTO shelves (market_line_id, name, provider, grid_width, grid_height, shelf_depth) VALUES
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'JRF #1', 'JRF', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'JRF #2', 'JRF', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'MIXTO #1', 'SUDEEP & GIVAUDAN', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'BASF #1', 'BASF', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'BASF #2', 'BASF', 10, 10, 10),
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'MEGGLE #1', 'MEGGLE', 10, 10, 10);

-- Create admin user (password: admin123, secret: secret123)
-- Note: These should be hashed in production
INSERT INTO users (username, password_hash, secret_password_hash, role) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Comments for documentation
COMMENT ON TABLE users IS 'Usuarios del sistema con autenticación JWT y contraseña secreta';
COMMENT ON TABLE market_lines IS 'Líneas de mercado: Cosmética (5 anaqueles), Farmacéutica (6), Industrial (3)';
COMMENT ON TABLE suppliers IS 'Proveedores de materias primas químicas (BASF, JRS, THOR, etc.)';
COMMENT ON TABLE shelves IS 'Anaqueles con grid 3D (width × height × depth) organizados por línea y proveedor';
COMMENT ON TABLE global_samples IS 'Muestras globales (bulk) con metadatos químicos, archivo CoA y relación con proveedor';
COMMENT ON TABLE dispensed_samples IS 'Muestras individuales (hijas del bulk) con QR único, dimensiones 3D variables y posición (x, y, z) en anaquel';
COMMENT ON TABLE movements IS 'Log completo de trazabilidad de todas las operaciones del sistema';