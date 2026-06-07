/**
 * SampleTooltip
 *
 * Tooltip compacto que aparece FLOTANDO A LA DERECHA-FRENTE de un cubo 3D
 * cuando el usuario lo clickea. Usa <Html> de @react-three/drei para
 * posicionarse en el espacio 3D pero se renderiza como DOM normal.
 *
 * Diseño: v2.1.1 - compacto y no invasivo. Se posiciona con offset
 * diagonal al cubo para no superponerlo. Fondo semitransparente para
 * que la muestra siga siendo visible a través.
 *
 * Muestra:
 *  - ID formateado (S-0001) + nombre
 *  - Lote + peso
 *  - Badge SGA con color
 *  - Botones: [Ver detalle] [+ Grupo] [→ Mover]
 *
 * Props:
 *  - sample: { id, name, lot, weight_grams, ghs_danger_class, ... }
 *  - sgaColor: hex color (calculado con getSGAColor)
 *  - onViewDetail: () => void
 *  - onAddToGroup: () => void
 *  - onMove: () => void
 *  - onClose: () => void
 *  - disabled: boolean
 */
import React from 'react';
import { formatSampleId } from '../../utils/formatSampleId';
import { SURFACE, BLUR, RADIUS, PADDING, FONT, ANIM, SHADOW, SGA_BADGE } from '../../constants';

const SampleTooltip = ({
  sample,
  sgaColor = '#38bdf8',
  onViewDetail,
  onAddToGroup,
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
        background: SURFACE.TOOLTIP,
        backdropFilter: BLUR.LG,
        border: `1px solid ${sgaColor}40`,
        borderRadius: RADIUS.LG,
        padding: PADDING.TOOLTIP,
        minWidth: 180,
        maxWidth: 220,
        boxShadow: `${SHADOW.TOOLTIP}, 0 0 0 1px ${sgaColor}20 inset`,
        fontFamily: 'system-ui, sans-serif',
        color: '#f1f5f9',
        userSelect: 'none',
        pointerEvents: 'auto',
        animation: ANIM.TOOLTIP_IN,
      }}
    >
      {/* Header: ID + nombre + close */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: FONT.ID_MONO.SIZE,
            color: sgaColor,
            fontWeight: FONT.ID_MONO.WEIGHT,
            letterSpacing: FONT.ID_MONO.LETTER_SPACING,
            fontFamily: FONT.ID_MONO.FAMILY,
          }}>
            {formatSampleId(sample.id)}
          </div>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#f8fafc',
            lineHeight: 1.2,
            marginTop: 1,
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
              fontSize: 13, cursor: 'pointer', padding: 0,
              lineHeight: 1, flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
          >✕</button>
        )}
      </div>

      {/* SGA badge */}
      {sgaClass && (
        <div style={{ ...SGA_BADGE(sgaColor), marginBottom: 6 }}>
          <span style={{ width: 4, height: 4, borderRadius: 2, background: sgaColor }} />
          SGA {sgaClass}
        </div>
      )}

      {/* Data mini-grid (lote, peso) */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
        fontSize: 9, marginBottom: 6,
        padding: '4px 6px',
        background: SURFACE.FIELD,
        border: `1px solid ${SURFACE.FIELD_BORDER}`,
        borderRadius: RADIUS.SM,
      }}>
        <DataRow label="Lote" value={sample.lot || '—'} />
        <DataRow label="Peso" value={sample.weight_grams ? `${sample.weight_grams}g` : '—'} />
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: 4 }}>
        {onViewDetail && (
          <button
            onClick={onViewDetail}
            disabled={disabled}
            data-testid="sample-tooltip-detail"
            style={{
              flex: 1, padding: '5px 6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: RADIUS.SM,
              color: '#cbd5e1', fontSize: 9, fontWeight: 700,
              cursor: disabled ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3, opacity: disabled ? 0.5 : 1,
            }}
          >Ver detalle</button>
        )}
        {onAddToGroup && (
          <button
            onClick={onAddToGroup}
            disabled={disabled}
            data-testid="sample-tooltip-add-group"
            title="Agregar al grupo de movimiento"
            style={{
              flex: 1, padding: '5px 6px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: RADIUS.SM,
              color: '#7dd3fc', fontSize: 9, fontWeight: 800,
              cursor: disabled ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3, opacity: disabled ? 0.5 : 1,
            }}
          >+ Grupo</button>
        )}
        {onMove && (
          <button
            onClick={onMove}
            disabled={disabled}
            data-testid="sample-tooltip-move"
            style={{
              flex: 1, padding: '5px 6px',
              background: disabled
                ? 'rgba(100, 116, 139, 0.3)'
                : 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
              border: '1px solid rgba(14, 165, 233, 0.4)',
              borderRadius: RADIUS.SM,
              color: '#fff', fontSize: 9, fontWeight: 800,
              cursor: disabled ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3,
              boxShadow: disabled ? 'none' : '0 2px 6px rgba(14, 165, 233, 0.3)',
            }}
          >→ Mover</button>
        )}
      </div>
    </div>
  );
};

const DataRow = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
    <span style={{
      fontSize: 8, color: '#64748b', fontWeight: 700,
      letterSpacing: 0.4, textTransform: 'uppercase',
    }}>{label}</span>
    <span style={{
      fontSize: 9, color: '#e2e8f0', fontWeight: 600,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }} title={String(value)}>{value}</span>
  </div>
);

export default SampleTooltip;
