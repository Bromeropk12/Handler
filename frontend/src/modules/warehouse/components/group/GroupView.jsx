/**
 * GroupView
 *
 * Vista del bottom sheet que muestra la selección de grupo activa.
 * Reemplaza al GroupToolbar flotante y a los modales de reject
 * (TypeMismatchModal, DimensionMismatchModal).
 *
 * Contiene:
 *  - Header con count + nombre del producto + SGA chip
 *  - Chips horizontales con las muestras del grupo (removibles)
 *  - Banner inline de reject (cuando hay un intento fallido)
 *  - Footer con botones Limpiar / Mover grupo
 *
 * Props:
 *  - samples: Array<sample>
 *  - selectionType: { id, name, dangerClass, dimensions, lot }
 *  - rejection: object | null
 *  - isStale: boolean
 *  - onRemoveSample: (id) => void
 *  - onClearAll: () => void
 *  - onConfirm: () => void            ← "Mover grupo"
 *  - onReplaceGroup: () => void       ← desde el banner
 *  - onDismissRejection: () => void
 *  - onChangeShelf: () => void
 *  - activeCrossShelfId: string|null
 *  - crossShelfButton: ReactNode      ← slot para el picker
 */
import React from 'react';
import RejectBanner from './RejectBanner';
import { getSGAColor } from '../3d/Shared3DComponents';
import { formatSampleId } from '../../utils/formatSampleId';

const GroupView = ({
  samples = [],
  selectionType,
  rejection = null,
  isStale = false,
  onRemoveSample,
  onClearAll,
  onConfirm,
  onReplaceGroup,
  onDismissRejection,
  crossShelfButton = null,
}) => {
  if (samples.length === 0) return null;

  const sgaColor = selectionType?.dangerClass
    ? getSGAColor(selectionType.dangerClass)
    : '#38bdf8';

  return (
    <div data-testid="group-view" style={{
      padding: '12px 16px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: '#38bdf8',
        }}>{samples.length}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            margin: 0, fontSize: 13, fontWeight: 800, color: '#f1f5f9',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {selectionType?.name || 'Muestras'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {selectionType?.dangerClass && (
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8,
                background: `${sgaColor}15`,
                color: sgaColor,
                border: `1px solid ${sgaColor}40`,
                letterSpacing: 0.5, textTransform: 'uppercase',
              }}>{selectionType.dangerClass}</span>
            )}
            {selectionType?.dimensions && (
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                color: '#94a3b8',
                fontFamily: 'monospace',
                letterSpacing: 0.5,
              }}>{selectionType.dimensions}</span>
            )}
            {isStale && (
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                letterSpacing: 0.4, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: 3,
                  background: '#fbbf24',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                Stale
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hint */}
      <p style={{
        margin: 0, fontSize: 10, color: '#64748b', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>🖱</span>
        {samples.length === 1
          ? 'Click otra del mismo tipo para agrupar · Arrastra para mover'
          : 'Arrastra cualquier cubo del grupo para mover todas'}
      </p>

      {/* Chips */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        overflowX: 'auto', overflowY: 'hidden',
        padding: '4px 0',
        scrollSnapType: 'x mandatory',
      }}>
        {samples.map((s) => (
          <div
            key={s.id}
            data-testid={`group-chip-${s.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 4px 4px 8px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: 14,
              fontSize: 10, fontWeight: 700, color: '#cbd5e1',
              flexShrink: 0,
              maxWidth: 200,
              scrollSnapAlign: 'start',
            }}
          >
            <span style={{
              fontSize: 9, color: '#38bdf8', fontWeight: 800,
              fontFamily: 'monospace',
            }}>{formatSampleId(s.id)}</span>
            <span style={{
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {s.lot ? `L:${s.lot}` : '—'}
            </span>
            {onRemoveSample && (
              <button
                onClick={() => onRemoveSample(s.id)}
                aria-label={`Quitar muestra ${s.id}`}
                data-testid={`group-chip-remove-${s.id}`}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: 'none', borderRadius: 10,
                  color: '#94a3b8', fontSize: 11,
                  width: 18, height: 18,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.color = '#f87171';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >✕</button>
            )}
          </div>
        ))}
      </div>

      {/* Reject banner */}
      <RejectBanner
        rejection={rejection}
        onReplace={onReplaceGroup}
        onDismiss={onDismissRejection}
      />

      {/* Actions footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'wrap',
      }}>
        {crossShelfButton}
        <div style={{ flex: 1 }} />
        <button
          onClick={onClearAll}
          data-testid="group-clear"
          style={{
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#cbd5e1',
            fontSize: 11, fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: 0.3,
          }}
        >✕ Limpiar</button>
        <button
          onClick={onConfirm}
          data-testid="group-confirm"
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
            border: '1px solid rgba(14,165,233,0.4)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 11, fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: 0.4,
            boxShadow: '0 4px 14px rgba(14,165,233,0.3)',
          }}
        >→ Mover grupo ({samples.length})</button>
      </div>
    </div>
  );
};

export default GroupView;
