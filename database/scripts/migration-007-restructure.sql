-- Migration 007: Restructure for GHS pictograms, signal word, supplier logos, and weight rename
-- Handler TrackSamples

-- 1. Agregar columnas de pictogramas GHS y palabra de señal a global_samples
ALTER TABLE global_samples ADD COLUMN IF NOT EXISTS ghs_pictograms TEXT[] DEFAULT '{}';
ALTER TABLE global_samples ADD COLUMN IF NOT EXISTS signal_word VARCHAR(20) DEFAULT 'ATENCION';

-- Agregar constraint para signal_word (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'global_samples_signal_word_check'
  ) THEN
    ALTER TABLE global_samples ADD CONSTRAINT global_samples_signal_word_check
      CHECK (signal_word IN ('PELIGRO', 'ATENCION'));
  END IF;
END $$;

-- 2. Renombrar weight_per_unit_grams → total_weight_grams
-- Verificar si la columna aún tiene el nombre viejo antes de renombrar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'global_samples' AND column_name = 'weight_per_unit_grams'
  ) THEN
    ALTER TABLE global_samples RENAME COLUMN weight_per_unit_grams TO total_weight_grams;
  END IF;
END $$;

-- 3. Agregar logo_path a suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS logo_path VARCHAR(500);

-- Inicializar logo_path para proveedores existentes basándose en nombres conocidos
UPDATE suppliers SET logo_path = 'recursos/proveedores/BASF-1-500x500.png' WHERE name = 'BASF' AND logo_path IS NULL;
UPDATE suppliers SET logo_path = 'recursos/proveedores/JRS-2-500x500.png' WHERE name = 'JRS' AND logo_path IS NULL;
UPDATE suppliers SET logo_path = 'recursos/proveedores/THOR-1-500x500.png' WHERE name = 'THOR' AND logo_path IS NULL;
UPDATE suppliers SET logo_path = 'recursos/proveedores/SUDEEP-500x500.png' WHERE name = 'SUDEEP' AND logo_path IS NULL;
UPDATE suppliers SET logo_path = 'recursos/proveedores/GIVAUDAN-500x500.png' WHERE name = 'GIVAUDAN' AND logo_path IS NULL;
UPDATE suppliers SET logo_path = 'recursos/proveedores/MEGGLE-1-500x500.png' WHERE name = 'MEGGLE' AND logo_path IS NULL;
UPDATE suppliers SET logo_path = 'recursos/proveedores/KS-500x500.png' WHERE name = 'KS' AND logo_path IS NULL;

-- 4. Agregar child_dimensions a dispensed_samples
ALTER TABLE dispensed_samples ADD COLUMN IF NOT EXISTS child_dimensions VARCHAR(10) DEFAULT '1x1x1';

-- 5. Índice para pictogramas (GIN para buscar dentro del array)
CREATE INDEX IF NOT EXISTS idx_global_samples_pictograms ON global_samples USING GIN (ghs_pictograms);

-- Verificación
DO $$
BEGIN
  RAISE NOTICE 'Migration 007 completed successfully';
END $$;
