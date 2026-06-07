/**
 * SampleTooltip
 *
 * Tooltip flotante que aparece ENCIMA de un cubo 3D cuando el usuario
 * lo clickea. Usa <Html> de @react-three/drei para posicionarse en el
 * espacio 3D pero se renderiza como DOM normal (sin z-index hacks).
 *
 * Muestra:
 *  - ID formateado (S-0001) + nombre
 *  - Lote + peso
 *  - Badge SGA con color
 *  - Botones: [Ver detalle] [Mover]
 *
 * Props:
 *  - sample: { id, name, lot, weight_grams, ghs_danger_class, ... }
 *  - sgaColor: hex color (calculado con getSGAColor)
 *  - onViewDetail: () => void          ← abre modal centrado
 *  - onMove: () => void                ← entra movement mode
 *  - onClose: () => void               ← cierra el tooltip (vuelve a IDLE)
 *  - disabled: boolean                 ← desactiva botones (durante movement mode, etc.)
 */
import React from 'react';
import { formatSampleId } from '../../utils/formatSampleId';

const SampleTooltip = ({
  sample,
  sgaColor = '#38bdf8',
  onViewDetail,
  onMove,
  onClose,
  disabled = false,
}) => {
  if (!sample) return null;

  const sgaClass = sample.ghs_danger_class || sample.danger_class || null;

  return (
    <div
      data-testid="sample-tooltip"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'relative',
        background: 'rgba(9, 13, 22, 0.94)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${sgaColor}50`,
        borderRadius: 12,
        padding: '10px 12px',
        minWidth: 220,
        maxWidth: 260,
        boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px ${sgaColor}20 inset`,
        fontFamily: 'system-ui, sans-serif',
        color: '#f1f5f9',
        userSelect: 'none',
        pointerEvents: 'auto',
        animation: 'sampleTooltipIn 180ms ease-out',
      }}
    >
      {/* Header: ID + nombre + close */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9, color: sgaColor, fontWeight: 800, letterSpacing: 0.4,
            fontFamily: 'monospace', marginBottom: 2,
          }}>
            {formatSampleId(sample.id)}
          </div>
          <div style={{
            fontSize: 12, fontWeight: 700, color: '#f8fafc',
            lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }} title={sample.name || sample.global_sample_name}>
            {sample.name || sample.global_sample_name || 'Sin nombre'}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            data-testid="sample-tooltip-close"
            aria-label="Cerrar"
            style={{
              background: 'none', border: 'none', color: '#64748b',
              fontSize: 14, cursor: 'pointer', padding: 0,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
          >✕</button>
        )}
      </div>

      {/* Data mini-grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
        fontSize: 10, marginBottom: 8,
      }}>
        <DataRow label="Lote" value={sample.lot || '—'} />
        <DataRow label="Peso" value={sample.weight_grams ? `${sample.weight_grams}g` : '—'} />
      </div>

      {/* SGA badge */}
      {sgaClass && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 6px', borderRadius: 4,
          background: `${sgaColor}15`,
          border: `1px solid ${sgaColor}30`,
          fontSize: 9, fontWeight: 800, color: sgaColor,
          letterSpacing: 0.4, textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: 2, background: sgaColor }} />
          SGA {sgaClass}
        </div>
      )}

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: 6 }}>
        {onViewDetail && (
          <button
            onClick={onViewDetail}
            disabled={disabled}
            data-testid="sample-tooltip-detail"
            style={{
              flex: 1, padding: '6px 8px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#cbd5e1', fontSize: 10, fontWeight: 700,
              cursor: disabled ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3, opacity: disabled ? 0.5 : 1,
            }}
          >Ver detalle</button>
        )}
        {onMove && (
          <button
            onClick={onMove}
            disabled={disabled}
            data-testid="sample-tooltip-move"
            style={{
              flex: 1, padding: '6px 8px',
              background: disabled
                ? 'rgba(100,116,139,0.3)'
                : 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
              border: '1px solid rgba(14,165,233,0.4)',
              borderRadius: 6,
              color: '#fff', fontSize: 10, fontWeight: 800,
              cursor: disabled ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3,
              boxShadow: disabled ? 'none' : '0 2px 8px rgba(14,165,233,0.3)',
            }}
          >→ Mover</button>
        )}
      </div>
    </div>
  );
};

const DataRow = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <span style={{
      fontSize: 8, color: '#64748b', fontWeight: 700,
      letterSpacing: 0.4, textTransform: 'uppercase',
    }}>{label}</span>
    <span style={{
      fontSize: 10, color: '#e2e8f0', fontWeight: 600,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }} title={String(value)}>{value}</span>
  </div>
);

export default SampleTooltip;
