/**
 * MovementView
 *
 * Vista del bottom sheet para el modo de movimiento individual legacy
 * (useSampleMovement). Reemplaza al SampleMovementToolbar, al
 * MovementModeOverlay, al TargetShelfPicker y al MovementConfirmModal.
 *
 * Tres sub-estados visuales dentro de la misma vista:
 *  - 'moving'   → wizard de asignación (pick target shelf + click cell)
 *  - 'target-picker' → inline shelf picker (no modal)
 *  - 'confirming' → preview con mini-mapa + conflicts + ejecutar
 *
 * BottomSheet con view='moving' auto-expande a 80% (regla en
 * BottomSheet.jsx).
 */
import React, { useState } from 'react';
import ShelfMiniMap3D from '../minimap/ShelfMiniMap3D';

const MovementView = ({
  mode,
  assignments = [],
  activeTargetShelf,
  isExecuting,
  executionErrors = [],
  nextUnassignedSampleId,
  isFullyAssigned,
  assignedCount,
  totalToAssign,
  onCancelMove,
  onAssignTarget,
  onChangeShelf,
  onReviewMove,
  onConfirmMove,
  availableShelves = [],
  currentShelfId,
  currentMapData,
}) => {
  const [showShelfPicker, setShowShelfPicker] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // ── sub-estado: 'moving' → wizard de asignación ──────────────────────
  if (mode === 'moving') {
    return (
      <div data-testid="movement-view" style={{
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <Header
          icon="→"
          title="Mover muestras"
          subtitle={`${assignedCount}/${totalToAssign} asignadas${nextUnassignedSampleId ? ' · siguiente lista' : ''}`}
        />

        {/* Progreso */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <ProgressBar current={assignedCount} total={totalToAssign} />
          {isFullyAssigned && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: '#34d399',
              letterSpacing: 0.4, textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>✓ LISTO</span>
          )}
        </div>

        {/* Siguiente muestra */}
        {nextUnassignedSampleId && (
          <div style={{
            padding: '8px 10px',
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: '#38bdf8',
              letterSpacing: 0.4, textTransform: 'uppercase',
            }}>SIGUIENTE</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#cbd5e1',
            }}>S-{String(nextUnassignedSampleId).slice(-3)}</span>
            <span style={{
              fontSize: 10, color: '#64748b', fontWeight: 600,
            }}>Click en una celda del 3D para asignar</span>
          </div>
        )}

        {/* Anaquel destino (picker inline) */}
        {onChangeShelf && availableShelves.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, color: '#64748b',
              letterSpacing: 0.4, textTransform: 'uppercase',
            }}>Destino</span>
            {showShelfPicker ? (
              <select
                onChange={(e) => {
                  const sh = availableShelves.find(s => s.id === e.target.value);
                  if (sh) onChangeShelf(sh);
                  setShowShelfPicker(false);
                }}
                data-testid="movement-shelf-select"
                defaultValue={activeTargetShelf?.id || currentShelfId}
                style={{
                  padding: '5px 8px',
                  background: 'rgba(9, 13, 22, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: 6,
                  color: '#cbd5e1', fontSize: 10,
                }}
              >
                {availableShelves.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.id === currentShelfId ? ' (origen)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setShowShelfPicker(true)}
                data-testid="movement-shelf-toggle"
                style={{
                  padding: '5px 10px',
                  background: 'rgba(56,189,248,0.08)',
                  border: '1px solid rgba(56,189,248,0.2)',
                  borderRadius: 6,
                  color: '#38bdf8',
                  fontSize: 10, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {activeTargetShelf?.name || 'origen'} ↔
              </button>
            )}
          </div>
        )}

        {/* Asignaciones actuales (lista compacta) */}
        {assignments.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            maxHeight: 80, overflowY: 'auto',
          }}>
            {assignments.map((a, i) => (
              <div key={a.sampleData.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 10, color: '#cbd5e1',
                padding: '3px 8px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderRadius: 4,
              }}>
                <span style={{
                  fontSize: 9, color: '#38bdf8', fontWeight: 800,
                  fontFamily: 'monospace',
                }}>S-{String(a.sampleData.id).slice(-3)}</span>
                <span>→</span>
                <span style={{ fontFamily: 'monospace', fontSize: 9 }}>
                  {a.target ? `(${a.target.x},${a.target.y},${a.target.z})` : '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          paddingTop: 10,
        }}>
          <div style={{ flex: 1 }} />
          <button
            onClick={onCancelMove}
            data-testid="movement-cancel"
            style={{
              padding: '9px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#cbd5e1',
              fontSize: 11, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.3,
            }}
          >✕ Cancelar</button>
          <button
            onClick={onReviewMove}
            disabled={!isFullyAssigned}
            data-testid="movement-review"
            style={{
              padding: '9px 16px',
              background: isFullyAssigned
                ? 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)'
                : 'rgba(100,116,139,0.4)',
              border: '1px solid rgba(14,165,233,0.4)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 11, fontWeight: 800,
              cursor: isFullyAssigned ? 'pointer' : 'not-allowed',
              letterSpacing: 0.4,
              boxShadow: isFullyAssigned ? '0 4px 14px rgba(14,165,233,0.3)' : 'none',
            }}
          >→ Revisar</button>
        </div>
      </div>
    );
  }

  // ── sub-estado: 'confirming' → preview + ejecutar ────────────────────
  if (mode === 'confirming') {
    return (
      <div data-testid="movement-confirm-view" style={{
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <Header
          icon="→"
          title="Confirmar movimiento"
          subtitle={`${assignments.length} muestras · batch`}
        />

        <div style={{
          display: 'grid', gridTemplateColumns: '220px 1fr',
          gap: 12, alignItems: 'stretch',
        }}>
          {/* Mini-mapa preview */}
          <div style={{
            width: 220, height: 180, borderRadius: 10,
            border: '1px solid rgba(56, 189, 248, 0.2)',
            background: 'rgba(9, 13, 22, 0.5)',
            position: 'relative', overflow: 'hidden',
          }}>
            {currentMapData ? (
              <div style={{ position: 'absolute', inset: 0 }}>
                <ShelfMiniMap3D
                  mapData={currentMapData}
                  target={
                    assignments[previewIndex]?.target
                      ? {
                          x: assignments[previewIndex].target.x,
                          y: assignments[previewIndex].target.y,
                          z: assignments[previewIndex].target.z,
                        }
                      : null
                  }
                  validity="valid"
                  title="Destino"
                  compact
                />
              </div>
            ) : null}
          </div>

          {/* Meta + lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 10, fontWeight: 700, color: '#cbd5e1',
            }}>
              <span style={{
                fontSize: 9, color: '#64748b', letterSpacing: 0.4,
                textTransform: 'uppercase', fontWeight: 800,
              }}>Asignaciones</span>
              {assignments.length > 1 && (
                <button
                  onClick={() => setPreviewIndex((previewIndex + 1) % assignments.length)}
                  style={{
                    padding: '2px 6px',
                    background: 'rgba(56,189,248,0.06)',
                    border: '1px solid rgba(56,189,248,0.2)',
                    borderRadius: 4,
                    color: '#38bdf8',
                    fontSize: 9, fontWeight: 700, cursor: 'pointer',
                  }}
                >↻ Siguiente ({previewIndex + 1}/{assignments.length})</button>
              )}
            </div>
            <div style={{
              maxHeight: 120, overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              {assignments.map((a, i) => (
                <div key={a.sampleData.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '3px 6px',
                  fontSize: 10,
                  background: i === previewIndex
                    ? 'rgba(56,189,248,0.1)'
                    : 'rgba(255,255,255,0.02)',
                  borderRadius: 4,
                  borderLeft: i === previewIndex
                    ? '2px solid #38bdf8'
                    : '2px solid transparent',
                }}>
                  <span style={{
                    fontFamily: 'monospace', color: '#38bdf8', fontWeight: 800, fontSize: 9,
                  }}>S-{String(a.sampleData.id).slice(-3)}</span>
                  <span style={{ color: '#64748b' }}>→</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#cbd5e1' }}>
                    ({a.target?.x},{a.target?.y},{a.target?.z})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Errors */}
        {executionErrors.length > 0 && (
          <div data-testid="movement-errors" style={{
            padding: '6px 8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 6,
            color: '#f87171',
            fontSize: 10, fontWeight: 700,
          }}>✕ {executionErrors.length} errores al ejecutar</div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          paddingTop: 10,
        }}>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => onChangeShelf(activeTargetShelf)}
            disabled={isExecuting}
            style={{
              padding: '9px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#cbd5e1',
              fontSize: 11, fontWeight: 700, cursor: isExecuting ? 'not-allowed' : 'pointer',
              letterSpacing: 0.3,
            }}
          >↩ Ajustar</button>
          <button
            onClick={onConfirmMove}
            disabled={isExecuting}
            data-testid="movement-execute"
            style={{
              padding: '9px 18px',
              background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: 8, color: '#fff',
              fontSize: 11, fontWeight: 800,
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              letterSpacing: 0.4,
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
            }}
          >{isExecuting ? '⟳ Ejecutando…' : `→ Ejecutar (${assignments.length})`}</button>
        </div>
      </div>
    );
  }

  return null;
};

const Header = ({ icon, title, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 800, color: '#fff',
    }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <h2 style={{
        margin: 0, fontSize: 13, fontWeight: 800, color: '#f1f5f9',
        letterSpacing: 0.2,
      }}>{title}</h2>
      <p style={{
        margin: '2px 0 0', fontSize: 10, color: '#64748b', fontWeight: 600,
      }}>{subtitle}</p>
    </div>
  </div>
);

const ProgressBar = ({ current, total }) => {
  const pct = total === 0 ? 0 : (current / total) * 100;
  return (
    <div style={{
      flex: 1, height: 5, borderRadius: 3,
      background: 'rgba(255,255,255,0.04)',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%',
        background: current === total
          ? 'linear-gradient(90deg, #34d399, #10b981)'
          : 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
        transition: 'width 250ms ease',
      }} />
    </div>
  );
};

export default MovementView;
