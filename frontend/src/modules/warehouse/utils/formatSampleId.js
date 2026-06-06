/**
 * formatSampleId
 *
 * Formato estandarizado para mostrar el id de una muestra en los
 * chips del bottom sheet (GroupView, MovementView, etc.).
 *
 * Reglas:
 *  - Siempre prefijo 'S-'
 *  - Zero-pad a 4 dígitos para alineación visual y anti-colisión
 *  - Si el id tiene más de 4 dígitos, se muestra completo (sin truncar)
 *  - Devuelve string (no número) para evitar pérdida de precisión
 *
 * @param {number|string} id
 * @returns {string} ej. 'S-0001', 'S-1234', 'S-99999'
 */
export const formatSampleId = (id) => {
  if (id == null) return 'S-????';
  const num = Number(id);
  if (Number.isNaN(num)) return 'S-????';
  // Si tiene 4 o menos dígitos, padStart a 4. Si tiene más, se muestra completo.
  const padded = num < 10000 ? String(num).padStart(4, '0') : String(num);
  return `S-${padded}`;
};

export const SAMPLE_ID_REGEX = /^S-\d+$/;

export default formatSampleId;
