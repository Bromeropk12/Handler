-- Migration 008: Short Code QR + Dispensed Size para almacén 3D
-- Fecha: 2026-04-14

-- 1. Añadir campo dispensed_size a global_samples
--    Representa el tamaño físico del frasco hijo en el almacén 3D
ALTER TABLE global_samples 
  ADD COLUMN IF NOT EXISTS dispensed_size VARCHAR(20) DEFAULT '1x1x1';

-- 2. Garantizar unicidad del qr_code en dispensed_samples
--    (El nuevo formato de short code requiere un índice para prevenir colisiones)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'dispensed_samples' 
      AND indexname = 'dispensed_samples_qr_code_unique'
  ) THEN
    CREATE UNIQUE INDEX dispensed_samples_qr_code_unique ON dispensed_samples(qr_code);
  END IF;
END $$;

-- 3. Comentarios descriptivos de los campos nuevos
COMMENT ON COLUMN global_samples.dispensed_size 
  IS 'Tamaño físico del frasco hijo (WxHxD) usado para su representación en el almacén 3D. Ej: 1x1x1, 2x1x1, etc.';

SELECT 'Migration 008 aplicada exitosamente.' AS resultado;
