/**
 * DimensionMismatchModal
 *
 * Modal que aparece cuando el usuario intenta agregar al grupo
 * una muestra con dimensiones distintas (mismo producto, distinto
 * tamaño físico). Solo se puede "Quitar" la nueva o "Reemplazar"
 * el grupo entero.
 */
import React from 'react';

const DimensionMismatchModal = ({ open, currentDims, newDims, newSample, onReplace, onCancel }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(2, 6, 16, 0.78)',
        backdropFilter: 'blur(12px)',
      }}
      role="dialog" aria-modal="true" aria-labelledby="dim-mismatch-title"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460, maxWidth: '90vw',
          background: 'linear-gradient(180deg, #0b1220 0%, #0a0f1c 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 18,
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,158,11,0.15) inset',
          padding: 28,
          color: '#f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>⚏</div>
          <div>
            <h3 id="dim-mismatch-title" style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: 0.4 }}>
              Dimensiones incompatibles
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8', letterSpacing: 0.3 }}>
              El grupo requiere muestras del mismo tamaño físico
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 22 }}>
          <div style={{
            flex: 1, padding: '10px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10, textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Grupo
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
              {currentDims}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: '#475569', fontSize: 16 }}>vs</div>
          <div style={{
            flex: 1, padding: '10px 12px',
            background: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.18)',
            borderRadius: 10, textAlign: 'center',
          }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Nueva
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
              {newDims}
            </p>
          </div>
        </div>

        {newSample?.global_sample_name && (
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 18px', textAlign: 'center' }}>
            Muestra: <strong style={{ color: '#e2e8f0' }}>{newSample.global_sample_name}</strong>
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: '#cbd5e1', fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}
          >Cancelar</button>
          <button
            onClick={onReplace}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
              border: '1px solid rgba(245,158,11,0.4)', borderRadius: 10,
              color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
            }}
          >Reemplazar grupo</button>
        </div>
      </div>
    </div>
  );
};

export default DimensionMismatchModal;
