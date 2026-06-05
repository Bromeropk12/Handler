/**
 * GroupConfirmModal
 *
 * Modal de confirmación final antes de ejecutar el move-en-grupo.
 * Muestra:
 *  - Lista de muestras del grupo (max 10)
 *  - Destino (x, y, z) y anaquel
 *  - Conflictos detectados por el backend (si preview los reportó)
 *  - Botón "Confirmar Movimiento" + "Cancelar"
 *
 * Props:
 *   - open: boolean
 *   - groupSamples: Array<sample>
 *   - target: {x, y, z, shelfId, shelfName}
 *   - conflicts: Array<{sample, reason}> (del backend, opcional)
 *   - isExecuting: boolean
 *   - error: string | null
 *   - onConfirm: () => void
 *   - onCancel: () => void
 */
import React from 'react';

const GroupConfirmModal = ({
  open,
  groupSamples = [],
  target,
  conflicts = [],
  isExecuting = false,
  error = null,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const hasConflicts = conflicts.length > 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(2, 6, 16, 0.78)',
        backdropFilter: 'blur(12px)',
      }}
      role="dialog" aria-modal="true" aria-labelledby="group-confirm-title"
      onClick={isExecuting ? undefined : onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 540, maxWidth: '92vw', maxHeight: '88vh',
          background: 'linear-gradient(180deg, #0b1220 0%, #0a0f1c 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 20,
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(56,189,248,0.12) inset',
          padding: 28,
          color: '#f1f5f9',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#38bdf8',
          }}>{groupSamples.length}</div>
          <div style={{ flex: 1 }}>
            <h3 id="group-confirm-title" style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: 0.4 }}>
              Confirmar movimiento de grupo
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8', letterSpacing: 0.3 }}>
              Vas a mover {groupSamples.length} {groupSamples.length === 1 ? 'muestra' : 'muestras'} en una sola transacción.
            </p>
          </div>
        </div>

        {hasConflicts && (
          <div style={{
            marginBottom: 16, padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 10,
          }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              ⚠ {conflicts.length} conflicto(s) detectado(s)
            </p>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 11, color: '#fca5a5' }}>
              {conflicts.slice(0, 3).map((c, i) => (
                <li key={i}>{c.sample?.global_sample_name || c.sample?.name || 'Muestra'}: {c.reason}</li>
              ))}
              {conflicts.length > 3 && <li>... y {conflicts.length - 3} más</li>}
            </ul>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 18 }}>
          <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Muestras a mover
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {groupSamples.map((s, idx) => (
              <div key={s.id || idx} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 4,
                  background: '#38bdf8',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.global_sample_name || s.name || 'Muestra'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 9, color: '#94a3b8' }}>
                    Lote: {s.lot || '—'} · SGA: {s.ghs_danger_class || 'N/A'}
                  </p>
                </div>
                <div style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace', textAlign: 'right' }}>
                  ({s.position_x + 1}, {s.position_y + 1}, {(s.position_z || 0) + 1})
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '12px 14px',
          background: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.18)',
          borderRadius: 12, marginBottom: 18,
        }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Destino
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 800 }}>
            {target?.shelfName || 'Anaquel'} <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>·</span>{' '}
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#38bdf8' }}>
              X:{target?.x + 1} · Y:{target?.y + 1} · Z:{(target?.z ?? 0) + 1}
            </span>
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: 14, padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 10, fontSize: 11, color: '#fca5a5',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={isExecuting}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: '#cbd5e1', fontSize: 12, fontWeight: 700,
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              opacity: isExecuting ? 0.5 : 1,
            }}
          >Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={isExecuting || hasConflicts}
            style={{
              padding: '10px 18px',
              background: hasConflicts
                ? 'rgba(107, 114, 128, 0.4)'
                : 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
              border: '1px solid rgba(14,165,233,0.4)', borderRadius: 10,
              color: '#fff', fontSize: 12, fontWeight: 800,
              cursor: isExecuting ? 'wait' : (hasConflicts ? 'not-allowed' : 'pointer'),
              letterSpacing: 0.4,
              boxShadow: hasConflicts ? 'none' : '0 4px 14px rgba(14,165,233,0.3)',
            }}
          >
            {isExecuting ? 'Moviendo…' : `Confirmar Movimiento (${groupSamples.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupConfirmModal;
