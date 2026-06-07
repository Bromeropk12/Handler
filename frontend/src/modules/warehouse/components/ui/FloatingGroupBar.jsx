/**
 * FloatingGroupBar
 *
 * Barra flotante que aparece en el CENTRO INFERIOR del viewport 3D
 * cuando hay 2+ muestras seleccionadas. Es la única "UI persistente"
 * de la nueva arquitectura: NO es un panel que se expande, es una
 * pill compacta que se auto-muestra/oculta.
 *
 * Muestra:
 *  - Contador grande con el número de muestras
 *  - Nombre del producto (truncado)
 *  - Badge SGA (color + letra)
 *  - Indicador 🟡 "stale" si los datos están desactualizados
 *  - Botón [✕ Limpiar]
 *  - Botón [→ Mover grupo]
 *
 * Props:
 *  - count: número de muestras seleccionadas
 *  - selectionType: { id, name, dangerClass, dimensions, lot }
 *  - isStale: boolean
 *  - disabled: boolean       ← durante movement mode, etc.
 *  - onClear: () => void
 *  - onMoveGroup: () => void
 */
import React from 'react';
import { getSGAColor } from '../3d/Shared3DComponents';

const FloatingGroupBar = ({
  count = 0,
  selectionType = null,
  isStale = false,
  disabled = false,
  onClear,
  onMoveGroup,
}) => {
  if (count < 2) return null;

  const sgaColor = selectionType?.dangerClass
    ? getSGAColor(selectionType.dangerClass)
    : '#38bdf8';
  const sgaLetter = selectionType?.dangerClass
    ? selectionType.dangerClass.toUpperCase()
    : '';

  return (
    <div
      data-testid="floating-group-bar"
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px 8px 14px',
        background: 'rgba(9, 13, 22, 0.92)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${sgaColor}40`,
        borderRadius: 14,
        boxShadow: `0 8px 28px rgba(0,0,0,0.55), 0 0 0 1px ${sgaColor}20 inset`,
        zIndex: 30,
        animation: 'floatingBarIn 220ms ease-out',
        maxWidth: 'calc(100% - 32px)',
      }}
    >
      {/* Contador */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 32, height: 32, borderRadius: 8,
        background: `${sgaColor}15`,
        border: `1px solid ${sgaColor}40`,
        color: sgaColor,
        fontSize: 13, fontWeight: 800,
        fontFamily: 'monospace',
        flexShrink: 0,
      }}>{count}</div>

      {/* Info de selección */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: 200 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#f1f5f9',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }} title={selectionType?.name || ''}>
            {selectionType?.name || `${count} muestras`}
          </span>
          {sgaLetter && (
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
              background: `${sgaColor}20`,
              color: sgaColor,
              border: `1px solid ${sgaColor}40`,
              letterSpacing: 0.4, textTransform: 'uppercase',
              flexShrink: 0,
            }}>{sgaLetter}</span>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, color: '#64748b',
        }}>
          <span>mismas dimensiones</span>
          {isStale && (
            <>
              <span>·</span>
              <span data-testid="stale-indicator" style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                color: '#fbbf24', fontWeight: 800, letterSpacing: 0.3,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: 3,
                  background: '#fbbf24',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  display: 'inline-block',
                }} />
                STALE
              </span>
            </>
          )}
        </div>
      </div>

      {/* Separador */}
      <div style={{
        width: 1, height: 24,
        background: 'rgba(255,255,255,0.08)',
        flexShrink: 0,
      }} />

      {/* Botones */}
      {onClear && (
        <button
          onClick={onClear}
          disabled={disabled}
          data-testid="floating-group-clear"
          aria-label="Limpiar selección"
          style={{
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#cbd5e1',
            fontSize: 10, fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            letterSpacing: 0.3,
            opacity: disabled ? 0.5 : 1,
            flexShrink: 0,
          }}
        >✕ Limpiar</button>
      )}
      {onMoveGroup && (
        <button
          onClick={onMoveGroup}
          disabled={disabled}
          data-testid="floating-group-move"
          style={{
            padding: '6px 12px',
            background: disabled
              ? 'rgba(100,116,139,0.3)'
              : 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)',
            border: '1px solid rgba(14,165,233,0.4)',
            borderRadius: 8,
            color: '#fff',
            fontSize: 10, fontWeight: 800,
            cursor: disabled ? 'not-allowed' : 'pointer',
            letterSpacing: 0.3,
            boxShadow: disabled ? 'none' : '0 2px 8px rgba(14,165,233,0.3)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >→ Mover grupo</button>
      )}
    </div>
  );
};

export default FloatingGroupBar;
