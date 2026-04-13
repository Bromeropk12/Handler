-- ============================================
-- HÄNDLER TRACKSAMPLES - SCHEMA DE BASE DE DATOS
-- PostgreSQL (usando librería pg, SIN Prisma)
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    secret_password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'manager')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: LÍNEAS DE MERCADO
-- ============================================
CREATE TABLE IF NOT EXISTS market_lines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar líneas de mercado por defecto
INSERT INTO market_lines (name, description) VALUES 
    ('Cosmética', 'Productos para industria cosmética'),
    ('Farmacéutica', 'Productos para industria farmacéutica'),
    ('Industrial', 'Productos para industria general')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TABLA: ANAQUELES (SHELVES)
-- ============================================
CREATE TABLE IF NOT EXISTS shelves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_line_id INTEGER REFERENCES market_lines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    total_capacity INTEGER DEFAULT 100,
    rows_count INTEGER DEFAULT 10,
    columns_count INTEGER DEFAULT 10,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: MUESTRAS GLOBALES (BULK)
-- ============================================
CREATE TABLE IF NOT EXISTS global_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    lot VARCHAR(100) NOT NULL,
    manufacture_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    total_weight_grams DECIMAL(10,2) NOT NULL CHECK (total_weight_grams >= 0),
    ghs_danger_class VARCHAR(50) CHECK (ghs_danger_class IN (
        'Inflamable', 'Corrosivo', 'Tóxico', 'Comburente', 
        'Irritante', 'Sin Riesgo', 'Peróxidos', 'Explosivo'
    )),
    market_line_id INTEGER REFERENCES market_lines(id) ON DELETE SET NULL,
    dimensions VARCHAR(10) DEFAULT '1x1' CHECK (dimensions IN ('1x1', '1x2', '2x1', '2x2')),
    coa_file_path VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas
CREATE INDEX idx_global_samples_market_line ON global_samples(market_line_id);
CREATE INDEX idx_global_samples_lot ON global_samples(lot);
CREATE INDEX idx_global_samples_expiration ON global_samples(expiration_date);

-- ============================================
-- TABLA: MUESTRAS DISPENSADAS (INDIVIDUALES)
-- ============================================
CREATE TABLE IF NOT EXISTS dispensed_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    global_sample_id UUID REFERENCES global_samples(id) ON DELETE SET NULL,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    weight_grams DECIMAL(10,2) NOT NULL CHECK (weight_grams >= 0),
    status VARCHAR(20) DEFAULT 'stored' CHECK (status IN ('stored', 'dispatched', 'expired')),
    shelf_id UUID REFERENCES shelves(id) ON DELETE SET NULL,
    position_x INTEGER CHECK (position_x >= 0 AND position_x < 10),
    position_y INTEGER CHECK (position_y >= 0 AND position_y < 10),
    dispensed_at TIMESTAMP DEFAULT NOW(),
    dispatched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_dispensed_samples_shelf ON dispensed_samples(shelf_id);
CREATE INDEX idx_dispensed_samples_qr ON dispensed_samples(qr_code);
CREATE INDEX idx_dispensed_samples_status ON dispensed_samples(status);

-- ============================================
-- TABLA: MOVIMIENTOS (TRAZABILIDAD)
-- ============================================
CREATE TABLE IF NOT EXISTS movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID NOT NULL,
    sample_type VARCHAR(20) NOT NULL CHECK (sample_type IN ('global', 'dispensed')),
    action_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_movements_sample ON movements(sample_id);
CREATE INDEX idx_movements_user ON movements(user_id);
CREATE INDEX idx_movements_timestamp ON movements(timestamp DESC);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Stock actual de Bulk
CREATE OR REPLACE VIEW v_bulk_stock AS
SELECT 
    gs.id,
    gs.name,
    gs.provider,
    gs.lot,
    gs.total_weight_grams,
    gs.expiration_date,
    gs.ghs_danger_class,
    ml.name as market_line_name,
    CASE 
        WHEN gs.expiration_date < CURRENT_DATE THEN 'VENCIDO'
        WHEN gs.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'PRÓXIMO A VENCER'
        ELSE 'VIGENTE'
    END as status
FROM global_samples gs
LEFT JOIN market_lines ml ON gs.market_line_id = ml.id
WHERE gs.total_weight_grams > 0;

-- Vista: Muestras en almacén
CREATE OR REPLACE VIEW v_stored_samples AS
SELECT 
    ds.id,
    ds.qr_code,
    ds.weight_grams,
    ds.status,
    ds.position_x,
    ds.position_y,
    gs.name as sample_name,
    gs.lot,
    gs.expiration_date,
    gs.ghs_danger_class,
    s.name as shelf_name,
    ml.name as market_line_name
FROM dispensed_samples ds
LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
LEFT JOIN shelves s ON ds.shelf_id = s.id
LEFT JOIN market_lines ml ON s.market_line_id = ml.id
WHERE ds.status = 'stored';

-- Vista: Ocupación por anaquel
CREATE OR REPLACE VIEW v_shelf_occupation AS
SELECT 
    s.id as shelf_id,
    s.name as shelf_name,
    ml.name as market_line_name,
    COUNT(ds.id) as total_samples,
    COALESCE(SUM(
        CASE 
            WHEN gs.dimensions = '1x1' THEN 1
            WHEN gs.dimensions = '1x2' THEN 2
            WHEN gs.dimensions = '2x1' THEN 2
            WHEN gs.dimensions = '2x2' THEN 4
            ELSE 1
        END
    ), 0) as occupied_cells,
    s.total_capacity
FROM shelves s
LEFT JOIN dispensed_samples ds ON s.id = ds.shelf_id AND ds.status = 'stored'
LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
LEFT JOIN market_lines ml ON s.market_line_id = ml.id
GROUP BY s.id, s.name, ml.name, s.total_capacity;

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para obtener ocupación de un anaquel específico
CREATE OR REPLACE FUNCTION get_shelf_occupation(p_shelf_id UUID)
RETURNS TABLE(
    shelf_id UUID,
    shelf_name VARCHAR,
    occupied_cells INTEGER,
    total_capacity INTEGER,
    percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        COALESCE(SUM(
            CASE 
                WHEN gs.dimensions = '1x1' THEN 1
                WHEN gs.dimensions = '1x2' THEN 2
                WHEN gs.dimensions = '2x1' THEN 2
                WHEN gs.dimensions = '2x2' THEN 4
                ELSE 1
            END
        ), 0)::INTEGER as occupied_cells,
        s.total_capacity,
        (COALESCE(SUM(
            CASE 
                WHEN gs.dimensions = '1x1' THEN 1
                WHEN gs.dimensions = '1x2' THEN 2
                WHEN gs.dimensions = '2x1' THEN 2
                WHEN gs.dimensions = '2x2' THEN 4
                ELSE 1
            END
        ), 0)::DECIMAL / s.total_capacity * 100) as percentage
    FROM shelves s
    LEFT JOIN dispensed_samples ds ON s.id = ds.shelf_id AND ds.status = 'stored'
    LEFT JOIN global_samples gs ON ds.global_sample_id = gs.id
    WHERE s.id = p_shelf_id
    GROUP BY s.id, s.name, s.total_capacity;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USUARIO ADMINISTRADOR POR DEFECTO
-- ============================================
-- Password: admin123
-- Secret: adminsecret
-- (Estas contraseñas deben cambiarse en producción)
INSERT INTO users (username, password_hash, secret_password_hash, role) 
VALUES (
    'admin',
    '$2b$10$rQZ8K6aO0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O', 
    '$2b$10$rQZ8K6aO0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O', 
    'admin'
)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- NOTAS
-- ============================================
-- Para crear el usuario admin real, ejecutar:
-- UPDATE users SET password_hash = crypt('tu_password', gen_salt('bf')) WHERE username = 'admin';
-- UPDATE users SET secret_password_hash = crypt('tu_contraseña_secreta', gen_salt('bf')) WHERE username = 'admin';