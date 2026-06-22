-- Migración 005: Agregar columna precaution_phrases a global_samples
-- Almacena frases de precaución personalizadas por muestra (JSONB array ordenado)

ALTER TABLE global_samples
  ADD COLUMN precaution_phrases JSONB NOT NULL DEFAULT '[]';

COMMENT ON COLUMN global_samples.precaution_phrases
  IS 'Array ordenado de frases de precaución personalizadas. Ej: [{"pictogram":"Inflamable","text":"..."}]';
