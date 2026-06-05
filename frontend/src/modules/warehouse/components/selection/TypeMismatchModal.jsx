/**
 * TypeMismatchModal
 *
 * Modal que aparece cuando el usuario intenta agregar al grupo
 * una muestra con distinto `global_sample_id`. Ofrece 2 acciones:
 *  - "Reemplazar grupo": limpia el grupo actual y empieza uno nuevo
 *  - "Cancelar": descarta la nueva selección
 *
 * Props:
 *   - open: boolean
 *   - currentType: {id, name, dangerClass, dimensions} | null
 *   - newSample: sample con global_sample_id distinto
 *   - onReplace: () => void
 *   - onCancel: () => void
 */
import React from 'react';

const TypeMismatchModal = ({ open, currentType, newSample, onReplace, onCancel }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(2, 6, 16, 0.78)',
        backdropFilter: 'blur(12px)',
      }}
      role="dialog" aria-modal="true" aria-labelledby="type-mismatch-title"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480, maxWidth: '90vw',
          background: 'linear-gradient(180deg, #0b1220 0%, #0a0f1c 100%)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 18,
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.15) inset',
          padding: 28,
          color: '#f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>⚠</div>
          <div>
            <h3 id="type-mismatch-title" style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: 0.4 }}>
              Tipo de muestra diferente
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8', letterSpacing: 0.3 }}>
              No se pueden agrupar muestras con productos distintos
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          <div style={{
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
          }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Grupo actual
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700 }}>
              {currentType?.name || '—'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#94a3b8' }}>
              {currentType?.dangerClass} · {currentType?.dimensions}
            </p>
          </div>

          <div style={{
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.18)',
            borderRadius: 10,
          }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Muestra que intentaste agregar
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700 }}>
              {newSample?.global_sample_name || newSample?.name || '—'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#94a3b8' }}>
              {newSample?.ghs_danger_class || 'Sin SGA'} · {newSample?.width || 1}x{newSample?.height || 1}x{newSample?.depth || 1}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: '#cbd5e1', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.4,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >Cancelar</button>
          <button
            onClick={onReplace}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
              border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10,
              color: '#fff', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', letterSpacing: 0.4,
              boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
            }}
          >Reemplazar grupo</button>
        </div>
      </div>
    </div>
  );
};

export default TypeMismatchModal;
