/**
 * MovementModal
 *
 * Modal flotante centrado que confirma un movimiento (single o group)
 * antes de ejecutar la API. Se abre cuando el usuario hace click en
 * una celda válida durante movement mode.
 *
 * Muestra:
 *  - Cantidad de muestras (1 / N)
 *  - Posición destino (X, Y, Z)
 *  - Nombre del anaquel destino (con badge "cruzado" si es diferente)
 *  - Mini-mapa 3D del destino (opcional, prop `mapData`)
 *  - Barra de conflictos (verde / rojo)
 *  - Errores del backend (si los hay)
 *
 * Props:
 *  - samples: Array<sample>
 *  - target: { x, y, z, shelfId, shelfName }
 *  - conflicts: Array              ← del preview del backend
 *  - mapData: object|null          ← para mini-mapa 3D
 *  - isExecuting: boolean
 *  - error: string|null
 *  - currentShelfId: string        ← para detectar cross-shelf
 *  - onCancel: () => void
 *  - onConfirm: () => void
 */
import React from 'react';
import { formatSampleId } from '../../utils/formatSampleId';
import ShelfMiniMap3D from '../minimap/ShelfMiniMap3D';

const MovementModal = ({
  samples = [],
  target,
  conflicts = [],
  mapData = null,
  isExecuting = false,
  error = null,
  currentShelfId,
  onCancel,
  onConfirm,
}) => {
  if (!target || samples.length === 0) return null;

  const isCrossShelf = target.shelfId && currentShelfId && target.shelfId !== currentShelfId;
  const compatibleCount = samples.length - conflicts.length;
  const canExecute = conflicts.length === 0 && !isExecuting;

  return (
    <div
      data-testid="movement-modal"
      onClick={!isExecuting ? onCancel : undefined}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 110,
        animation: 'modalFadeIn 160ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(13, 18, 28, 0.96)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 16,
          padding: '20px 24px',
          width: 'min(540px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(56,189,248,0.1) inset',
          animation: 'modalSlideUp 220ms ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>→</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              margin: 0, fontSize: 15, fontWeight: 800, color: '#f1f5f9',
              letterSpacing: 0.2,
            }}>Confirmar movimiento</h2>
            <p style={{
              margin: '3px 0 0', fontSize: 11, color: '#64748b', fontWeight: 600,
            }}>
              {samples.length === 1
                ? `Muestra ${formatSampleId(samples[0].id)}`
                : `${samples.length} muestras · batch atómico`}
            </p>
          </div>
        </div>

        {/* Body: mapa + meta */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: mapData ? '220px 1fr' : '1fr',
          gap: 12,
          marginBottom: 16,
        }}>
          {mapData && (
            <div style={{
              width: 220, height: 160, borderRadius: 10,
              border: '1px solid rgba(56, 189, 248, 0.2)',
              background: 'rgba(9, 13, 22, 0.5)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0 }}>
                <ShelfMiniMap3D
                  mapData={mapData}
                  target={{ x: target.x, y: target.y, z: target.z }}
                  validity={conflicts.length === 0 ? 'valid' : 'invalid'}
                  title="Destino"
                  compact
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MetaRow label="Posición destino" value={`(${target.x}, ${target.y}, ${target.z})`} mono />
            <MetaRow
              label="Anaquel"
              value={
                isCrossShelf ? (
                  <span>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>↗</span>{' '}
                    {target.shelfName || target.shelfId}{' '}
                    <span style={{ color: '#64748b', fontSize: 9 }}>(cruzado)</span>
                  </span>
                ) : (
                  <span style={{ color: '#cbd5e1' }}>{target.shelfName || 'mismo anaquel'}</span>
                )
              }
            />

            {/* Validity bar */}
            <div style={{ marginTop: 6 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 9, fontWeight: 800, letterSpacing: 0.4,
                color: conflicts.length === 0 ? '#34d399' : '#f87171',
                marginBottom: 4,
              }}>
                <span>{conflicts.length === 0 ? '✓ SIN CONFLICTOS' : `⚠ ${conflicts.length} CONFLICTOS`}</span>
                <span style={{ color: '#64748b' }}>{compatibleCount}/{samples.length}</span>
              </div>
              <div style={{
                height: 4, borderRadius: 2,
                background: 'rgba(255,255,255,0.04)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(compatibleCount / samples.length) * 100}%`,
                  height: '100%',
                  background: conflicts.length === 0
                    ? 'linear-gradient(90deg, #34d399, #10b981)'
                    : 'linear-gradient(90deg, #f87171, #ef4444)',
                  transition: 'width 250ms ease',
                }} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div data-testid="movement-modal-error" style={{
                marginTop: 6, padding: '8px 10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 6,
                color: '#fca5a5',
                fontSize: 10, fontWeight: 700,
              }}>✕ {error}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          justifyContent: 'flex-end',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          paddingTop: 12,
        }}>
          <button
            onClick={onCancel}
            disabled={isExecuting}
            data-testid="movement-modal-cancel"
            style={{
              padding: '9px 18px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#cbd5e1', fontSize: 11, fontWeight: 700,
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3,
              opacity: isExecuting ? 0.5 : 1,
            }}
          >✕ Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={!canExecute}
            data-testid="movement-modal-confirm"
            style={{
              padding: '9px 20px',
              background: canExecute
                ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                : 'rgba(100,116,139,0.4)',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: 8,
              color: '#fff', fontSize: 11, fontWeight: 800,
              cursor: canExecute ? 'pointer' : 'not-allowed',
              letterSpacing: 0.4,
              boxShadow: canExecute ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
            }}
          >{isExecuting ? '⟳ Ejecutando…' : `→ Mover ${samples.length}`}</button>
        </div>
      </div>
    </div>
  );
};

const MetaRow = ({ label, value, mono = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
    <span style={{
      fontSize: 9, fontWeight: 800, color: '#64748b',
      letterSpacing: 0.4, textTransform: 'uppercase',
      flexShrink: 0, minWidth: 80,
    }}>{label}</span>
    <span style={{
      flex: 1, minWidth: 0,
      fontSize: 11, fontWeight: 700, color: '#cbd5e1',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      fontFamily: mono ? 'monospace' : 'inherit',
    }}>{value}</span>
  </div>
);

export default MovementModal;
