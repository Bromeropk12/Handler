/**
 * SampleDetailView
 *
 * Vista del bottom sheet que muestra la información detallada
 * de una muestra clickeada. Reemplaza al antiguo tooltip 3D
 * (Html grande) que aparecía sobre el cubo.
 *
 * Se actualiza en vivo cuando el usuario clickea otro cubo.
 *
 * Props:
 *  - sample: sample object
 *  - isInGroup: boolean                          ← si ya está en el grupo
 *  - isAlreadyInGroupOfOne: boolean              ← si es la única muestra del grupo
 *  - onAddToGroup: () => void
 *  - onRemoveFromGroup: () => void
 *  - onMoveSingle: () => void                    ← single-move legacy
 *  - onViewHistory: () => void
 *  - onClose: () => void
 */
import React, { useMemo } from 'react';
import { getSGAColor } from '../3d/Shared3DComponents';

const formatDate = (isoDate) => {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return isoDate;
  }
};

const getDaysUntilExpiration = (isoDate) => {
  if (!isoDate) return null;
  const ms = new Date(isoDate).getTime() - Date.now();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

// const STATUS_LABELS = {
//   occupied: 'Almacenada',
//   warning: 'Por vencer',
//   expired: 'Vencida',
// };

const SampleDetailView = ({
  sample,
  isInGroup = false,
  isAlreadyInGroupOfOne = false,
  onAddToGroup,
  onRemoveFromGroup,
  onMoveSingle,
  onViewHistory,
  onClose,
}) => {
  const sgaColor = useMemo(
    () => sample ? getSGAColor(sample.ghs_danger_class) : '#64748b',
    [sample]
  );

  if (!sample) return null;

  const daysToExpire = getDaysUntilExpiration(sample.expiration_date);
  let expirationLabel = '—';
  let expirationColor = '#94a3b8';
  if (daysToExpire !== null) {
    if (daysToExpire < 0) { expirationLabel = `Vencida hace ${-daysToExpire}d`; expirationColor = '#ef4444'; }
    else if (daysToExpire < 30) { expirationLabel = `${daysToExpire}d`; expirationColor = '#facc15'; }
    else { expirationLabel = `${daysToExpire}d`; expirationColor = '#34d399'; }
  }

  const dims = `${sample.width || 1}×${sample.height || 1}×${sample.depth || 1}`;
  const position = `X:${(sample.position_x ?? 0) + 1}  Y:${(sample.position_y ?? 0) + 1}  Z:${(sample.position_z ?? 0) + 1}`;

  return (
    <div data-testid="sample-detail-view" style={{
      padding: '12px 16px 14px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${sgaColor}20`,
          border: `1px solid ${sgaColor}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: sgaColor,
        }}>{(sample.ghs_danger_class || '?').charAt(0)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            margin: 0, fontSize: 14, fontWeight: 800, color: '#f1f5f9',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {sample.global_sample_name || sample.name || 'Muestra'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {sample.ghs_danger_class && (
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8,
                background: `${sgaColor}15`,
                color: sgaColor,
                border: `1px solid ${sgaColor}40`,
                letterSpacing: 0.5, textTransform: 'uppercase',
              }}>{sample.ghs_danger_class}</span>
            )}
            {isInGroup && (
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                letterSpacing: 0.5, textTransform: 'uppercase',
              }}>En grupo</span>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar detalle"
            data-testid="sample-detail-close"
            style={{
              background: 'none', border: 'none',
              color: '#64748b', fontSize: 16,
              cursor: 'pointer', padding: '4px 8px',
              borderRadius: 4,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >✕</button>
        )}
      </div>

      {/* Data grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 8,
      }}>
        {[
          ['Lote', sample.lot || '—'],
          ['Peso', sample.weight_grams ? `${sample.weight_grams} g` : '—'],
          ['Dim', dims],
          ['Posición', position],
          ['Vence', formatDate(sample.expiration_date)],
        ].map(([k, v]) => (
          <div key={k} style={{
            padding: '6px 8px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 6,
          }}>
            <p style={{
              margin: 0, fontSize: 8, fontWeight: 800, color: '#64748b',
              letterSpacing: 1, textTransform: 'uppercase',
            }}>{k}</p>
            <p style={{
              margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#e2e8f0',
              fontFamily: k === 'Posición' || k === 'Dim' ? 'monospace' : 'inherit',
            }}>{v}</p>
          </div>
        ))}
        {daysToExpire !== null && (
          <div style={{
            padding: '6px 8px',
            background: `${expirationColor}10`,
            border: `1px solid ${expirationColor}30`,
            borderRadius: 6,
          }}>
            <p style={{
              margin: 0, fontSize: 8, fontWeight: 800, color: '#64748b',
              letterSpacing: 1, textTransform: 'uppercase',
            }}>Días</p>
            <p style={{
              margin: '2px 0 0', fontSize: 11, fontWeight: 800, color: expirationColor,
            }}>{expirationLabel}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'wrap',
      }}>
        {isInGroup ? (
          <button
            onClick={onRemoveFromGroup}
            disabled={isAlreadyInGroupOfOne}
            data-testid="sample-detail-remove"
            style={{
              padding: '8px 12px',
              background: isAlreadyInGroupOfOne ? 'rgba(107, 114, 128, 0.2)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isAlreadyInGroupOfOne ? 'rgba(107, 114, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: 8,
              color: isAlreadyInGroupOfOne ? '#64748b' : '#f87171',
              fontSize: 11, fontWeight: 700,
              cursor: isAlreadyInGroupOfOne ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3,
            }}
          >− Quitar del grupo</button>
        ) : (
          <button
            onClick={onAddToGroup}
            data-testid="sample-detail-add"
            style={{
              padding: '8px 12px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 8,
              color: '#38bdf8',
              fontSize: 11, fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.3,
            }}
          >+ Agregar al grupo</button>
        )}
        <button
          onClick={onMoveSingle}
          data-testid="sample-detail-move"
          style={{
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#cbd5e1',
            fontSize: 11, fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: 0.3,
          }}
        >→ Mover individualmente</button>
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
          >Ver historial</button>
        )}
      </div>
    </div>
  );
};

export default SampleDetailView;
