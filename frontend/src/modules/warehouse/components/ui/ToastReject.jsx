/**
 * ToastReject
 *
 * Toast pequeño (3s auto-dismiss) que aparece en la parte SUPERIOR
 * del viewport cuando el usuario intenta agregar al grupo una muestra
 * incompatible. NO es un modal: no bloquea la interacción.
 *
 * Props:
 *  - rejection: { type, message, newSample }
 *  - onReplace: () => void
 *  - onDismiss: () => void
 *  - autoDismissMs: number
 */
import React, { useEffect } from 'react';
import { RADIUS, PADDING, ANIM, SHADOW } from '../../constants';

const TYPE_CONFIG = {
  type:       { color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)', icon: '⚠', label: 'Tipo diferente' },
  dimension:  { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', icon: '⚏', label: 'Dimensiones incompatibles' },
  limit:      { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)', icon: '⛔', label: 'Límite alcanzado' },
  status:     { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)', icon: 'ⓘ', label: 'Estado no compatible' },
  multiShelf: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)', icon: 'ⓘ', label: 'Multi-shelf' },
  partial:    { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)', icon: 'ⓘ', label: 'Selección parcial' },
};

const ToastReject = ({
  rejection,
  onReplace,
  onDismiss,
  autoDismissMs = 3000,
}) => {
  useEffect(() => {
    if (!rejection || autoDismissMs <= 0) return undefined;
    const t = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, autoDismissMs);
    return () => clearTimeout(t);
  }, [rejection, autoDismissMs, onDismiss]);

  if (!rejection || !rejection.type) return null;
  const cfg = TYPE_CONFIG[rejection.type] || TYPE_CONFIG.status;
  const supportsReplace = ['type', 'dimension', 'multiShelf'].includes(rejection.type);

  return (
    <div
      data-testid="toast-reject"
      data-reject-type={rejection.type}
      style={{
        position: 'fixed',
        top: 80, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: PADDING.TOAST,
        minWidth: 280, maxWidth: 400,
        background: cfg.bg,
        backdropFilter: 'blur(16px)',
        border: `1px solid ${cfg.border}`,
        borderRadius: RADIUS.MD + 2,
        boxShadow: `${SHADOW.TOAST}, 0 0 0 1px ${cfg.color}15 inset`,
        animation: ANIM.TOAST_DOWN,
        pointerEvents: 'auto',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 16, lineHeight: 1, color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 11, fontWeight: 800, color: cfg.color,
          letterSpacing: 0.3,
        }}>{cfg.label}</p>
        <p style={{
          margin: '2px 0 0', fontSize: 10, color: '#cbd5e1', lineHeight: 1.3,
        }}>{rejection.message || 'Muestra incompatible con el grupo actual.'}</p>
        {supportsReplace && onReplace && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              onClick={onReplace}
              data-testid="toast-reject-replace"
              style={{
                padding: '4px 10px',
                background: cfg.color, border: 'none', borderRadius: 5,
                color: '#fff', fontSize: 10, fontWeight: 700,
                cursor: 'pointer', letterSpacing: 0.3,
              }}
            >Reemplazar grupo</button>
            <button
              onClick={onDismiss}
              data-testid="toast-reject-dismiss"
              style={{
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 5,
                color: '#94a3b8', fontSize: 10, fontWeight: 700,
                cursor: 'pointer', letterSpacing: 0.3,
              }}
            >Descartar</button>
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Cerrar"
          style={{
            background: 'none', border: 'none',
            color: '#64748b', fontSize: 13, cursor: 'pointer',
            padding: 0, lineHeight: 1, flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
        >✕</button>
      )}
    </div>
  );
};

export default ToastReject;
