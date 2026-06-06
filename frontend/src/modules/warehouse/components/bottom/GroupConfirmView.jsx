/**
 * GroupConfirmView
 *
 * Vista del bottom sheet que confirma el drag-en-grupo antes de
 * ejecutar el commit batch. Reemplaza al GroupConfirmModal.
 *
 * Layout:
 *  ┌──────────────────────────────────────┐
 *  │  Confirmar movimiento (N muestras)  │
 *  │  ──────────────────────────────────  │
 *  │  ┌──────┐  ┌────────────────────┐    │
 *  │  │Mini3D│  │ Target: (X, Y, Z) │    │
 *  │  │ 220× │  │ Anaquel origen/dst │    │
 *  │  │ 180  │  │ Validity halo      │    │
 *  │  └──────┘  │ Mismatches: 0/3    │    │
 *  │            └────────────────────┘    │
 *  │  ──────────────────────────────────  │
 *  │  [↩ Ajustar]   [→ Mover N]         │
 *  └──────────────────────────────────────┘
 *
 * El BottomSheet padre debe auto-expandirse a 80% cuando
 * view === 'confirm' (regla en BottomSheet.jsx).
 *
 * Props:
 *  - samples: Array<sample>        ← grupo
 *  - target: { x, y, z, shelfId, shelfName }
 *  - conflicts: Array              ← preview del backend
 *  - targetMapData: object|null    ← mapa del anaquel destino (mini3D)
 *  - isExecuting: boolean
 *  - error: string|null
 *  - onCancel: () => void
 *  - onConfirm: () => void
 *  - onChangeShelf: (shelfId) => void
 *  - availableShelves: Array<{id,name}>  ← para picker inline
 *  - currentShelfId: string
 */
import React, { useState } from 'react';
import ShelfMiniMap3D from '../minimap/ShelfMiniMap3D';

const GroupConfirmView = ({
  samples = [],
  target,
  conflicts = [],
  targetMapData = null,
  isExecuting = false,
  error = null,
  onCancel,
  onConfirm,
  onChangeShelf,
  availableShelves = [],
  currentShelfId,
}) => {
  const [showShelfPicker, setShowShelfPicker] = useState(false);

  if (samples.length === 0 || !target) return null;

  const compatibleCount = samples.length - conflicts.length;
  const targetShelf = availableShelves.find(s => s.id === target.shelfId);
  const isCrossShelf = target.shelfId && target.shelfId !== currentShelfId;

  return (
    <div data-testid="group-confirm-view" style={{
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: '#fff',
        }}>→</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            margin: 0, fontSize: 13, fontWeight: 800, color: '#f1f5f9',
            letterSpacing: 0.2,
          }}>Confirmar movimiento</h2>
          <p style={{
            margin: '2px 0 0', fontSize: 10, color: '#64748b', fontWeight: 600,
          }}>
            {samples.length} muestras · batch atómico
          </p>
        </div>
      </div>

      {/* Body: mini-mapa + meta */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gap: 12,
        alignItems: 'stretch',
      }}>
        {/* Mini-mapa destino (compact 220×180) */}
        <div style={{
          width: 220, height: 180,
          borderRadius: 10,
          border: '1px solid rgba(56, 189, 248, 0.2)',
          background: 'rgba(9, 13, 22, 0.5)',
          position: 'relative', overflow: 'hidden',
        }}>
          {targetMapData ? (
            <div style={{ position: 'absolute', inset: 0 }}>
              <ShelfMiniMap3D
                mapData={targetMapData}
                target={target}
                validity={conflicts.length === 0 ? 'valid' : 'invalid'}
                title="Destino"
                compact
              />
            </div>
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', fontSize: 10, fontWeight: 600,
            }}>Cargando…</div>
          )}
        </div>

        {/* Meta: target, shelf, validity, conflicts */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          minWidth: 0,
        }}>
          <MetaRow label="Posición destino" value={`(${target.x}, ${target.y}, ${target.z})`} mono />
          <MetaRow
            label="Anaquel"
            value={
              isCrossShelf ? (
                <span>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>↗</span>{' '}
                  {targetShelf?.name || target.shelfName || target.shelfId}{' '}
                  <span style={{ color: '#64748b', fontSize: 9 }}>(cruzado)</span>
                </span>
              ) : (
                <span style={{ color: '#cbd5e1' }}>
                  {targetShelf?.name || target.shelfName || 'origen'}
                </span>
              )
            }
          />

          {/* Shelf picker toggle */}
          {onChangeShelf && availableShelves.length > 1 && (
            <>
              <button
                onClick={() => setShowShelfPicker(v => !v)}
                data-testid="confirm-shelf-toggle"
                style={{
                  alignSelf: 'flex-start',
                  padding: '4px 8px',
                  background: 'rgba(56,189,248,0.06)',
                  border: '1px solid rgba(56,189,248,0.2)',
                  borderRadius: 6,
                  color: '#38bdf8',
                  fontSize: 9, fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: 0.3,
                }}
              >{showShelfPicker ? '✕ Cancelar cambio' : '↔ Cambiar anaquel'}</button>

              {showShelfPicker && (
                <select
                  onChange={(e) => {
                    onChangeShelf(e.target.value);
                    setShowShelfPicker(false);
                  }}
                  data-testid="confirm-shelf-select"
                  defaultValue={target.shelfId || currentShelfId}
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(9, 13, 22, 0.9)',
                    border: '1px solid rgba(56,189,248,0.3)',
                    borderRadius: 6,
                    color: '#cbd5e1',
                    fontSize: 10,
                  }}
                >
                  {availableShelves.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.id === currentShelfId ? ' (actual)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          {/* Validity bar */}
          <div style={{
            marginTop: 4,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 9, fontWeight: 800, letterSpacing: 0.4,
              color: conflicts.length === 0 ? '#34d399' : '#f87171',
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
            <div data-testid="confirm-error" style={{
              padding: '6px 8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 6,
              color: '#f87171',
              fontSize: 10, fontWeight: 700,
            }}>✕ {error}</div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        borderTop: '1px solid rgba(255,255,255,0.04)',
        paddingTop: 10,
        marginTop: 2,
      }}>
        <div style={{ flex: 1 }} />
        <button
          onClick={onCancel}
          disabled={isExecuting}
          data-testid="confirm-cancel"
          style={{
            padding: '9px 16px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#cbd5e1',
            fontSize: 11, fontWeight: 700,
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            letterSpacing: 0.3,
            opacity: isExecuting ? 0.5 : 1,
          }}
        >↩ Ajustar</button>
        <button
          onClick={onConfirm}
          disabled={isExecuting || conflicts.length > 0}
          data-testid="confirm-execute"
          style={{
            padding: '9px 18px',
            background: conflicts.length > 0
              ? 'rgba(100,116,139,0.4)'
              : 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
            border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 11, fontWeight: 800,
            cursor: isExecuting || conflicts.length > 0 ? 'not-allowed' : 'pointer',
            letterSpacing: 0.4,
            boxShadow: conflicts.length === 0 ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
            opacity: isExecuting ? 0.5 : 1,
          }}
        >{isExecuting ? '⟳ Moviendo…' : `→ Mover ${samples.length}`}</button>
      </div>
    </div>
  );
};

const MetaRow = ({ label, value, mono = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
    <span style={{
      fontSize: 9, fontWeight: 800, color: '#64748b',
      letterSpacing: 0.4, textTransform: 'uppercase',
      flexShrink: 0, minWidth: 60,
    }}>{label}</span>
    <span style={{
      flex: 1, minWidth: 0,
      fontSize: 11, fontWeight: 700,
      color: '#cbd5e1',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      fontFamily: mono ? 'monospace' : 'inherit',
    }}>{value}</span>
  </div>
);

export default GroupConfirmView;
