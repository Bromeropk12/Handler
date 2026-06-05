/**
 * GroupToolbar
 *
 * Toolbar flotante que aparece cuando hay 2+ muestras seleccionadas.
 * Muestra:
 *  - Count del grupo (badge)
 *  - Nombre del producto + SGA (chip)
 *  - Botón "Limpiar selección"
 *  - Hint: "Arrastra cualquier muestra del grupo para moverlas todas"
 *
 * Props:
 *   - count: number
 *   - selectionType: {id, name, dangerClass, dimensions, lot}
 *   - onClear: () => void
 *   - isStale: boolean (de useShelfStaleness)
 */
import React from 'react';

const GroupToolbar = ({ count = 0, selectionType, onClear, isStale = false }) => {
  if (count < 2) return null;

  return (
    <div
      style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: 'linear-gradient(180deg, rgba(11, 18, 32, 0.92) 0%, rgba(10, 15, 28, 0.92) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.1) inset',
        maxWidth: '90vw',
      }}
      role="toolbar" aria-label="Toolbar de grupo"
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 10px',
        background: 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: 20,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: 4,
          background: '#38bdf8', boxShadow: '0 0 6px #38bdf8',
        }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', letterSpacing: 0.4 }}>
          {count} muestras agrupadas
        </span>
      </div>

      {selectionType?.name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#f1f5f9',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 200,
          }}>
            {selectionType.name}
          </span>
          {selectionType.dangerClass && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 10,
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              letterSpacing: 0.5, textTransform: 'uppercase',
            }}>{selectionType.dangerClass}</span>
          )}
        </div>
      )}

      <div style={{
        width: 1, height: 20, background: 'rgba(255,255,255,0.08)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#64748b', fontWeight: 600 }}>
        <span>🖱</span>
        <span>Arrastra para mover todas</span>
      </div>

      {isStale && (
        <>
          <div style={{ width: 1, height: 20, background: 'rgba(245, 158, 11, 0.2)' }} />
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            letterSpacing: 0.4, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: 3,
              background: '#fbbf24',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            Datos desactualizados
          </span>
        </>
      )}

      <button
        onClick={onClear}
        title="Limpiar selección (Esc)"
        style={{
          padding: '6px 10px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, color: '#94a3b8', fontSize: 10, fontWeight: 700,
          cursor: 'pointer', letterSpacing: 0.4,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
          e.currentTarget.style.color = '#f87171';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >✕ Limpiar</button>
    </div>
  );
};

export default GroupToolbar;
