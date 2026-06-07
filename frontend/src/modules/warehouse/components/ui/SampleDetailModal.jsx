/**
 * SampleDetailModal
 *
 * Modal flotante centrado con la información COMPLETA de una muestra.
 * Se abre cuando el usuario hace click en "Ver detalle" del tooltip.
 *
 * Diferencia con el SampleTooltip:
 *  - Tooltip = 2-3 campos + acciones (compacto, vive en 3D)
 *  - Modal = TODOS los campos + más espacio para acciones
 *
 * Props:
 *  - sample: sample object
 *  - onClose: () => void
 *  - onAddToGroup: () => void     ← botón "Agregar a grupo" (v2.1)
 *  - onMoveSingle: () => void     ← botón "Mover individual"
 *  - isExecuting: boolean         ← durante movimiento
 */
import React from 'react';
import { formatSampleId } from '../../utils/formatSampleId';
import { getSGAColor } from '../3d/Shared3DComponents';

const STATUS_LABELS = {
  occupied: 'Activa',
  warning: 'Por vencer',
  expired: 'Vencida',
};
const STATUS_COLORS = {
  occupied: '#34d399',
  warning: '#facc15',
  expired: '#f87171',
};

const SampleDetailModal = ({
  sample,
  onClose,
  onAddToGroup,
  onMoveSingle,
  isExecuting = false,
}) => {
  if (!sample) return null;

  const sgaClass = sample.ghs_danger_class || sample.danger_class || null;
  const sgaColor = sgaClass ? getSGAColor(sgaClass) : '#38bdf8';
  const status = sample.status || 'occupied';
  const statusLabel = STATUS_LABELS[status] || 'Muestra';
  const statusColor = STATUS_COLORS[status] || '#94a3b8';

  // Cálculo de días para vencer
  let daysLabel = '—';
  if (sample.expiration_date) {
    const days = Math.ceil(
      (new Date(sample.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) daysLabel = `${Math.abs(days)}d vencido`;
    else if (days === 0) daysLabel = 'Vence hoy';
    else daysLabel = `${days}d`;
  }

  return (
    <div
      data-testid="sample-detail-modal"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
        animation: 'modalFadeIn 160ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(13, 18, 28, 0.96)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${sgaColor}30`,
          borderRadius: 16,
          padding: '20px 24px',
          width: 'min(440px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px ${sgaColor}15 inset`,
          animation: 'modalSlideUp 220ms ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          marginBottom: 16,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${sgaColor}15`,
            border: `1px solid ${sgaColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: sgaColor,
            fontFamily: 'monospace',
            flexShrink: 0,
          }}>{sgaClass || '?'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, color: statusColor, fontWeight: 800,
              letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 3,
            }}>{statusLabel} · {formatSampleId(sample.id)}</div>
            <h2 style={{
              margin: 0, fontSize: 16, fontWeight: 800, color: '#f1f5f9',
              lineHeight: 1.2,
            }}>{sample.name || sample.global_sample_name || 'Sin nombre'}</h2>
          </div>
          <button
            onClick={onClose}
            data-testid="sample-detail-modal-close"
            aria-label="Cerrar"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              color: '#94a3b8', fontSize: 13, cursor: 'pointer',
              width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
          >✕</button>
        </div>

        {/* Data grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          marginBottom: 16,
        }}>
          <Field label="Lote" value={sample.lot || '—'} />
          <Field label="Peso" value={sample.weight_grams ? `${sample.weight_grams} g` : '—'} />
          <Field label="SGA" value={sgaClass || 'N/A'} accentColor={sgaColor} />
          <Field label="Estado" value={statusLabel} accentColor={statusColor} />
          {sample.width && sample.height && sample.depth && (
            <Field
              label="Dimensiones"
              value={`${sample.width}×${sample.height}×${sample.depth}`}
              mono
            />
          )}
          {sample.expiration_date && (
            <Field
              label="Vencimiento"
              value={`${sample.expiration_date.substring(0, 10)} (${daysLabel})`}
              accentColor={status === 'expired' ? '#f87171' : status === 'warning' ? '#facc15' : null}
            />
          )}
          {sample.position_x !== undefined && (
            <Field
              label="Posición"
              value={`(${(sample.position_x ?? 0) + 1}, ${(sample.position_y ?? 0) + 1}, ${((sample.position_z ?? 0) || 0) + 1})`}
              mono
            />
          )}
          {sample.shelf_name && (
            <Field label="Anaquel" value={sample.shelf_name} />
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'flex-end',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          paddingTop: 12,
        }}>
          <button
            onClick={onClose}
            data-testid="sample-detail-modal-cancel"
            style={{
              padding: '9px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#cbd5e1', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.3,
            }}
          >Cerrar</button>
          {onAddToGroup && (
            <button
              onClick={onAddToGroup}
              disabled={isExecuting}
              data-testid="sample-detail-modal-add-group"
              title="Agregar al grupo de movimiento"
              style={{
                padding: '9px 16px',
                background: 'rgba(56,189,248,0.08)',
                border: '1px solid rgba(56,189,248,0.35)',
                borderRadius: 8,
                color: '#7dd3fc', fontSize: 11, fontWeight: 800,
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                letterSpacing: 0.3,
                opacity: isExecuting ? 0.5 : 1,
              }}
            >+ Agregar a grupo</button>
          )}
          {onMoveSingle && (
            <button
              onClick={onMoveSingle}
              disabled={isExecuting}
              data-testid="sample-detail-modal-move"
              style={{
                padding: '9px 18px',
                background: isExecuting
                  ? 'rgba(100,116,139,0.4)'
                  : 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
                border: '1px solid rgba(14,165,233,0.4)',
                borderRadius: 8,
                color: '#fff', fontSize: 11, fontWeight: 800,
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                letterSpacing: 0.3,
                boxShadow: isExecuting ? 'none' : '0 2px 8px rgba(14,165,233,0.3)',
              }}
            >{isExecuting ? '⟳ Moviendo…' : '→ Mover individual'}</button>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, mono = false, accentColor = null }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 3,
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: 6,
  }}>
    <span style={{
      fontSize: 8, color: '#64748b', fontWeight: 800,
      letterSpacing: 0.4, textTransform: 'uppercase',
    }}>{label}</span>
    <span style={{
      fontSize: 12, fontWeight: 700,
      color: accentColor || '#f1f5f9',
      fontFamily: mono ? 'monospace' : 'inherit',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }} title={String(value)}>{value}</span>
  </div>
);

export default SampleDetailModal;
