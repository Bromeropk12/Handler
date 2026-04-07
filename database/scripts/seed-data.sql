-- Seed Data - Datos reales para el sistema Handler TrackSamples
-- Fecha: 2026-04-06
-- 
-- ORDEN DE INSERCION:
-- 1. Líneas de mercado
-- 2. Proveedores
-- 3. Anaqueles vinculados a líneas y proveedores
-- 4. Usuario admin

-- ==========================================
-- PASO 1: Líneas de mercado
-- ==========================================
INSERT INTO market_lines (name) VALUES
('Cosmética'),
('Farmacéutica'),
('Industrial')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- PASO 2: Proveedores principales de Handler
-- ==========================================
INSERT INTO suppliers (name, market_lines, phone, email, address) VALUES
('BASF', ARRAY['Cosmética', 'Industrial', 'Farmacéutica'], '+57 1 234 5678', 'contacto@basf.com.co', 'Bogotá, Colombia'),
('JRS (J. Rettenmaier & Söhne)', ARRAY['Cosmética'], '+57 1 345 6789', 'colombia@jrs.de', 'Medellín, Colombia'),
('THOR', ARRAY['Cosmética', 'Industrial'], '+57 1 456 7890', 'info@thor.com', 'Cali, Colombia'),
('JRF (Jai Research Foundation)', ARRAY['Farmacéutica'], '+57 1 567 8901', 'sales@jrf.com', 'Barranquilla, Colombia'),
('SUDEEP', ARRAY['Farmacéutica'], '+57 1 678 9012', 'export@sudeep.com', 'Cartagena, Colombia'),
('GIVAUDAN', ARRAY['Farmacéutica'], '+57 1 789 0123', 'colombia@givaudan.com', 'Bogotá, Colombia'),
('MEGGLE', ARRAY['Farmacéutica'], '+57 1 890 1234', 'pharma@meggle.com', 'Bucaramanga, Colombia')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- PASO 3: Anaqueles con sus proveedores
-- ==========================================

-- Cosmética: 5 anaqueles (3 BASF, 1 JRS, 1 THOR)
INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'BASF #1', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Cosmética'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'BASF #2', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Cosmética'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'BASF #3', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Cosmética'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'JRS #1', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Cosmética'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'THOR #1', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Cosmética'
ON CONFLICT (market_line_id, name) DO NOTHING;

-- Industrial: 3 anaqueles (1 BASF, 1 MIXTO, 1 BULK)
INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'BASF #1', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Industrial'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'MIXTO #1', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Industrial'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'BULK #1', 10, 10, 10, 'bulk_temporary'
FROM market_lines ml WHERE ml.name = 'Industrial'
ON CONFLICT (market_line_id, name) DO NOTHING;

-- Farmacéutica: 6 anaqueles (2 JRF, 1 MIXTO, 2 BASF, 1 MEGGLE)
INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'JRF #1', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Farmacéutica'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'JRF #2', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Farmacéutica'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'MIXTO #1', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Farmacéutica'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'BASF #1', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Farmacéutica'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'BASF #2', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Farmacéutica'
ON CONFLICT (market_line_id, name) DO NOTHING;

INSERT INTO shelves (market_line_id, name, grid_width, grid_height, shelf_depth, shelf_type)
SELECT ml.id, 'MEGGLE #1', 10, 10, 10, 'storage'
FROM market_lines ml WHERE ml.name = 'Farmacéutica'
ON CONFLICT (market_line_id, name) DO NOTHING;

-- ==========================================
-- PASO 4: Vincular proveedores a anaqueles
-- ==========================================

-- Cosmética - BASF #1
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'BASF #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Cosmética')
  AND sup.name = 'BASF'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Cosmética - BASF #2
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'BASF #2' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Cosmética')
  AND sup.name = 'BASF'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Cosmética - BASF #3
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'BASF #3' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Cosmética')
  AND sup.name = 'BASF'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Cosmética - JRS #1
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'JRS #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Cosmética')
  AND sup.name = 'JRS (J. Rettenmaier & Söhne)'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Cosmética - THOR #1
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'THOR #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Cosmética')
  AND sup.name = 'THOR'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Industrial - BASF #1
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'BASF #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Industrial')
  AND sup.name = 'BASF'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Industrial - MIXTO #1 (BASF + THOR)
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'MIXTO #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Industrial')
  AND sup.name = 'BASF'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, false
FROM shelves s, suppliers sup
WHERE s.name = 'MIXTO #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Industrial')
  AND sup.name = 'THOR'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Industrial - BULK #1
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'BULK #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Industrial')
  AND sup.name = 'BASF'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Farmacéutica - JRF #1
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'JRF #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Farmacéutica')
  AND sup.name = 'JRF (Jai Research Foundation)'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Farmacéutica - JRF #2
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'JRF #2' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Farmacéutica')
  AND sup.name = 'JRF (Jai Research Foundation)'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Farmacéutica - MIXTO #1 (SUDEEP + GIVAUDAN)
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'MIXTO #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Farmacéutica')
  AND sup.name = 'SUDEEP'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, false
FROM shelves s, suppliers sup
WHERE s.name = 'MIXTO #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Farmacéutica')
  AND sup.name = 'GIVAUDAN'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Farmacéutica - BASF #1
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'BASF #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Farmacéutica')
  AND sup.name = 'BASF'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Farmacéutica - BASF #2
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'BASF #2' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Farmacéutica')
  AND sup.name = 'BASF'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- Farmacéutica - MEGGLE #1
INSERT INTO shelf_suppliers (shelf_id, supplier_id, is_primary)
SELECT s.id, sup.id, true
FROM shelves s, suppliers sup
WHERE s.name = 'MEGGLE #1' 
  AND s.market_line_id = (SELECT id FROM market_lines WHERE name = 'Farmacéutica')
  AND sup.name = 'MEGGLE'
ON CONFLICT (shelf_id, supplier_id) DO NOTHING;

-- ==========================================
-- PASO 5: Usuario admin (si no existe)
-- ==========================================
-- password: admin123, secret: secret123
INSERT INTO users (username, password_hash, secret_password_hash, role) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================
SELECT 'Líneas de mercado' as tabla, COUNT(*) as total FROM market_lines
UNION ALL
SELECT 'Proveedores', COUNT(*) FROM suppliers
UNION ALL
SELECT 'Anaqueles', COUNT(*) FROM shelves
UNION ALL
SELECT 'Relaciones anaquel-proveedor', COUNT(*) FROM shelf_suppliers
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM users;
