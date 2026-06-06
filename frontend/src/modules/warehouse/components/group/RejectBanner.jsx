/**
 * RejectBanner
 *
 * Banner inline (no modal) que aparece en GroupView cuando el usuario
 * intenta agregar al grupo una muestra incompatible. Ofrece acciones
 * inline "Reemplazar grupo" / "Descartar" sin ocultar nada del 3D.
 *
 * Tipos:
 *  - 'type'      → "Esta muestra es de otro producto" (rojo)
 *  - 'dimension' → "Esta muestra es de otro tamaño" (ámbar)
 *  - 'limit'     → "Máximo 10 muestras por grupo" (azul)
 *  - 'status'    → "Esta muestra no está almacenada" (azul)
 *  - 'multiShelf'→ "Las muestras deben estar en el mismo anaquel" (azul)
 *  - 'partial'   → "Algunas muestras no se pudieron agregar" (azul)
 */
import React from 'react';

const TYPE_CONFIG = {
  type: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
    icon: '⚠',
    title: 'Tipo de muestra diferente',
    message: 'Esta muestra es de otro producto.',
  },
  dimension: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.25)',
    icon: '⚏',
    title: 'Dimensiones incompatibles',
    message: 'Esta muestra es de otro tamaño físico.',
  },
  limit: {
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.25)',
    icon: '⛔',
    title: 'Límite alcanzado',
    message: 'Máximo 10 muestras por grupo.',
  },
  status: {
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.25)',
    icon: 'ⓘ',
    title: 'Estado no compatible',
    message: 'Solo se pueden agrupar muestras almacenadas.',
  },
  multiShelf: {
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.25)',
    icon: 'ⓘ',
    title: 'Multi-shelf no permitido',
    message: 'Las muestras deben estar en el mismo anaquel.',
  },
  partial: {
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.08)',
    border: 'rgba(56, 189, 248, 0.25)',
    icon: 'ⓘ',
    title: 'Selección parcial',
    message: 'Algunas muestras no se pudieron agregar.',
  },
};

const RejectBanner = ({ rejection, onReplace, onDismiss }) => {
  if (!rejection || !rejection.type) return null;
  const cfg = TYPE_CONFIG[rejection.type] || TYPE_CONFIG.status;
  const supportsReplace = ['type', 'dimension', 'multiShelf'].includes(rejection.type);

  return (
    <div
      data-testid="reject-banner"
      data-reject-type={rejection.type}
      style={{
        margin: '8px 16px 0',
        padding: '10px 12px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        animation: 'slideDown 200ms ease',
      }}
    >
      <div style={{
        fontSize: 16, lineHeight: 1, color: cfg.color, flexShrink: 0,
      }}>{cfg.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 11, fontWeight: 800, color: cfg.color,
          letterSpacing: 0.3,
        }}>{cfg.title}</p>
        <p style={{
          margin: '2px 0 0', fontSize: 11, color: '#cbd5e1',
        }}>{cfg.message}</p>
        {supportsReplace && onReplace && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              onClick={onReplace}
              data-testid="reject-replace"
              style={{
                padding: '5px 10px',
                background: cfg.color,
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontSize: 10, fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 0.3,
              }}
            >Reemplazar grupo</button>
            <button
              onClick={onDismiss}
              data-testid="reject-dismiss"
              style={{
                padding: '5px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#94a3b8',
                fontSize: 10, fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: 0.3,
              }}
            >Descartar</button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Cerrar banner"
          style={{
            background: 'none', border: 'none',
            color: '#64748b', fontSize: 12,
            cursor: 'pointer', padding: '0 4px',
            lineHeight: 1,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#cbd5e1'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
        >✕</button>
      )}
    </div>
  );
};

export default RejectBanner;
