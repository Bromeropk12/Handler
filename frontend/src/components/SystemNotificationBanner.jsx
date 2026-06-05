import React, { useState, useEffect } from 'react';

/**
 * Banner de notificación del sistema en tiempo real.
 * Se monta encima del contenido principal cuando el backend emite un evento SSE.
 *
 * Props:
 *   notification  - Objeto con { type, title, message, minutesUntilRestart, countdown }
 *   onDismiss     - Función para cerrar el banner
 */
const SystemNotificationBanner = ({ notification, onDismiss }) => {
  const [secondsLeft, setSecondsLeft] = useState(null);

  // Countdown ticker en segundos
  useEffect(() => {
    if (!notification?.countdown || !notification?.minutesUntilRestart) return;
    setSecondsLeft(notification.minutesUntilRestart * 60);

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [notification]);

  if (!notification) return null;

  const isWarning = notification.type === 'warning';
  const bgColor = isWarning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(6, 182, 212, 0.15)';
  const borderColor = isWarning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(6, 182, 212, 0.4)';
  const textColor = isWarning ? '#fde68a' : '#a5f3fc';
  const iconBg = isWarning ? 'rgba(245, 158, 11, 0.2)' : 'rgba(6, 182, 212, 0.2)';

  const formatCountdown = (secs) => {
    if (secs === null) return '';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 3rem)',
        maxWidth: '700px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '14px',
        padding: '1rem 1.25rem',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        animation: 'slideDown 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
        }}
      >
        {isWarning ? '⚠️' : '🔄'}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: textColor, margin: 0 }}>
          {notification.title}
        </p>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', margin: '0.2rem 0 0' }}>
          {notification.message}
        </p>
      </div>

      {/* Countdown */}
      {notification.countdown && secondsLeft !== null && (
        <div
          style={{
            flexShrink: 0,
            padding: '0.3rem 0.75rem',
            borderRadius: '8px',
            background: iconBg,
            border: `1px solid ${borderColor}`,
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: textColor,
            minWidth: '60px',
            textAlign: 'center',
          }}
        >
          {formatCountdown(secondsLeft)}
        </div>
      )}

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        style={{
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '1.1rem',
          padding: '0.25rem',
          lineHeight: 1,
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.target.style.color = '#fff'}
        onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
        title="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
};

export default SystemNotificationBanner;
