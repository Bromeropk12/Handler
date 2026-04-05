-- Handler TrackSamples Database Initialization
-- PostgreSQL Script for creating all tables with UUIDs and timestamps

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE danger_class AS ENUM ('Sin Riesgo', 'Inflamable', 'Corrosivo', 'Toxico', 'Comburente', 'Explosivo');
CREATE TYPE sample_status AS ENUM ('stored', 'dispatched', 'expired');
CREATE TYPE dimensions AS ENUM ('1x1', '1x2', '2x1', '2x2');
CREATE TYPE action_type AS ENUM ('created', 'dispensed', 'stored', 'moved', 'dispatched', 'expired');
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

-- Shelves table (Anaqueles)
CREATE TABLE shelves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_line_id UUID NOT NULL REFERENCES market_lines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(100), -- BASF, JRS, THOR, MEGGLE, etc.
    grid_width INTEGER NOT NULL DEFAULT 10 CHECK (grid_width > 0 AND grid_width <= 50),
    grid_height INTEGER NOT NULL DEFAULT 10 CHECK (grid_height > 0 AND grid_height <= 50),
    total_capacity INTEGER GENERATED ALWAYS AS (grid_width * grid_height) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(market_line_id, name)
);

-- Global samples table (Muestras Bulk)
CREATE TABLE global_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    lot VARCHAR(100) NOT NULL,
    expiration_date DATE NOT NULL,
    manufacture_date DATE NOT NULL,
    ghs_danger_class danger_class NOT NULL,
    market_line_id UUID NOT NULL REFERENCES market_lines(id) ON DELETE CASCADE,
    dimensions dimensions NOT NULL,
    total_weight_grams DECIMAL(10,2) NOT NULL CHECK (total_weight_grams > 0),
    current_weight_grams DECIMAL(10,2) NOT NULL CHECK (current_weight_grams >= 0),
    coa_file_path VARCHAR(500), -- Ruta al archivo CoA PDF del bulk
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (manufacture_date <= expiration_date),
    CHECK (current_weight_grams <= total_weight_grams)
);

-- Dispensed samples table (Muestras Individuales)
CREATE TABLE dispensed_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    global_sample_id UUID NOT NULL REFERENCES global_samples(id) ON DELETE CASCADE,
    qr_code VARCHAR(500) UNIQUE NOT NULL,
    qr_data JSONB, -- Datos del QR (id, lote, nombre, submuestra, peso_gramos)
    weight_grams DECIMAL(8,2) NOT NULL CHECK (weight_grams > 0),
    status sample_status DEFAULT 'stored',
    shelf_id UUID REFERENCES shelves(id) ON DELETE SET NULL,
    position_x INTEGER,
    position_y INTEGER,
    width INTEGER NOT NULL DEFAULT 1 CHECK (width >= 1 AND width <= 2),
    height INTEGER NOT NULL DEFAULT 1 CHECK (height >= 1 AND height <= 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    CHECK (position_x >= 0),
    CHECK (position_y >= 0),
    CHECK ((width = 1 AND height = 1) OR (width = 1 AND height = 2) OR (width = 2 AND height = 1) OR (width = 2 AND height = 2))
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
CREATE INDEX idx_dispensed_samples_global_sample ON dispensed_samples(global_sample_id);
CREATE INDEX idx_dispensed_samples_qr ON dispensed_samples(qr_code);
CREATE INDEX idx_dispensed_samples_shelf ON dispensed_samples(shelf_id);
CREATE INDEX idx_dispensed_samples_status ON dispensed_samples(status);
CREATE INDEX idx_dispensed_samples_position ON dispensed_samples(shelf_id, position_x, position_y);
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

-- Insert shelves according to company distribution
-- Cosmética: 5 anaqueles (3 BASF, 1 JRS, 1 THOR)
INSERT INTO shelves (market_line_id, name, provider, grid_width, grid_height) VALUES
((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'BASF #1', 'BASF', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'BASF #2', 'BASF', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'BASF #3', 'BASF', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'JRS #1', 'JRS', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Cosmética'), 'THOR #1', 'THOR', 10, 10);

-- Industrial: 3 anaqueles (1 BASF, 1 BASF & THOR Mixto, 1 BULK)
INSERT INTO shelves (market_line_id, name, provider, grid_width, grid_height) VALUES
((SELECT id FROM market_lines WHERE name = 'Industrial'), 'BASF #1', 'BASF', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Industrial'), 'MIXTO #1', 'BASF & THOR', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Industrial'), 'BULK #1', 'BULK', 10, 10);

-- Farmacéutica: 6 anaqueles (2 JRF, 1 SUDEEP & GIVAUDAN Mixto, 2 BASF, 1 MEGGLE)
INSERT INTO shelves (market_line_id, name, provider, grid_width, grid_height) VALUES
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'JRF #1', 'JRF', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'JRF #2', 'JRF', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'MIXTO #1', 'SUDEEP & GIVAUDAN', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'BASF #1', 'BASF', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'BASF #2', 'BASF', 10, 10),
((SELECT id FROM market_lines WHERE name = 'Farmacéutica'), 'MEGGLE #1', 'MEGGLE', 10, 10);

-- Create admin user (password: admin123, secret: secret123)
-- Note: These should be hashed in production
INSERT INTO users (username, password_hash, secret_password_hash, role) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Comments for documentation
COMMENT ON TABLE users IS 'Usuarios del sistema con autenticación JWT y contraseña secreta';
COMMENT ON TABLE market_lines IS 'Líneas de mercado: Cosmética (5 anaqueles), Farmacéutica (6), Industrial (3)';
COMMENT ON TABLE shelves IS 'Anaqueles con grid 2D (width x height) organizados por línea y proveedor';
COMMENT ON TABLE global_samples IS 'Muestras globales (bulk) con metadatos químicos y archivo CoA';
COMMENT ON TABLE dispensed_samples IS 'Muestras individuales con QR único, dimensiones variables y posición en anaquel';
COMMENT ON TABLE movements IS 'Log completo de trazabilidad de todas las operaciones del sistema';