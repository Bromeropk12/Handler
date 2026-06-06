/**
 * EmptyView
 *
 * Hint estática que aparece en el bottom sheet cuando no hay
 * ninguna muestra clickeada ni seleccionada. Sutil (40px de alto,
 * opacidad 0.65) para no competir con el 3D map.
 *
 * Props:
 *  - hasActiveSelection: boolean    ← si hay grupo activo, baja opacidad
 */
import React from 'react';

const EmptyView = ({ hasActiveSelection = false }) => (
  <div
    data-testid="empty-view"
    style={{
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
      opacity: hasActiveSelection ? 0.35 : 0.7,
      transition: 'opacity 0.3s',
      userSelect: 'none',
    }}
  >
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 11, fontWeight: 600,
      color: '#64748b', letterSpacing: 0.3,
    }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: 9,
        background: 'rgba(56, 189, 248, 0.1)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        fontSize: 10,
      }}>💡</span>
      <span>
        Click en un cubo para ver detalles · Click en varios del mismo tipo para agrupar ·{' '}
        <kbd style={{
          padding: '1px 5px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 3,
          fontSize: 9, fontFamily: 'monospace',
          color: '#94a3b8',
        }}>Esc</kbd> para limpiar
      </span>
    </div>
  </div>
);

export default EmptyView;
