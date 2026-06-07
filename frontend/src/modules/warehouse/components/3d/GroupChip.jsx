/**
 * GroupChip
 *
 * Mini badge flotante que aparece ENCIMA de cada cubo 3D cuando
 * pertenece a un grupo seleccionado. Muestra el ID formateado
 * (S-0001) y un dot del color SGA de la muestra.
 *
 * Usa <Html> de @react-three/drei para posicionarse en el espacio
 * 3D. NO tiene botones: es solo una etiqueta identificativa.
 *
 * Props:
 *  - sample: { id, ghs_danger_class }
 *  - sgaColor: hex color
 */
import React from 'react';
import { formatSampleId } from '../../utils/formatSampleId';

const GroupChip = ({ sample, sgaColor = '#38bdf8' }) => {
  if (!sample) return null;
  return (
    <div
      data-testid={`group-chip-${sample.id}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px 3px 6px',
        background: 'rgba(9, 13, 22, 0.92)',
        backdropFilter: 'blur(12px)',
        border: `1.5px solid ${sgaColor}`,
        borderRadius: 10,
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: 800,
        color: '#f1f5f9',
        letterSpacing: 0.3,
        boxShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 8px ${sgaColor}40`,
        userSelect: 'none',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: 3, background: sgaColor,
        boxShadow: `0 0 4px ${sgaColor}`,
      }} />
      {formatSampleId(sample.id)}
    </div>
  );
};

export default GroupChip;
