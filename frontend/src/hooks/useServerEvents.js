import { useState, useEffect, useCallback } from 'react';

/**
 * Hook que se conecta al canal SSE del backend y emite eventos de sistema
 * como notificaciones de reinicio o actualización a todos los clientes LAN.
 *
 * @returns {{ notification: object|null, dismissNotification: function }}
 */
export function useServerEvents() {
  const [notification, setNotification] = useState(null);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  useEffect(() => {
    // No conectar si estamos en modo setup o fuera de producción
    if (!window.location) return;

    let eventSource;
    let retryTimeout;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    function connect() {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.addEventListener('connected', () => {
          console.log('[SSE] Conectado al canal de eventos del servidor.');
          retryCount = 0;
        });

        eventSource.addEventListener('system-restart', (e) => {
          try {
            const data = JSON.parse(e.data);
            setNotification({
              type: 'warning',
              title: '⚠️ Mantenimiento Programado',
              message: data.message || 'El sistema se reiniciará en breve.',
              minutesUntilRestart: data.minutesUntilRestart,
              timestamp: data.timestamp,
              countdown: true
            });
          } catch (_) {}
        });

        eventSource.addEventListener('system-update', (e) => {
          try {
            const data = JSON.parse(e.data);
            setNotification({
              type: 'info',
              title: '🔄 Actualización del Sistema',
              message: data.message || `Actualización ${data.version} disponible.`,
              timestamp: data.timestamp,
              countdown: false
            });
          } catch (_) {}
        });

        eventSource.onerror = () => {
          eventSource.close();
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = Math.min(1000 * 2 ** retryCount, 30000);
            console.warn(`[SSE] Desconectado. Reintentando en ${delay / 1000}s...`);
            retryTimeout = setTimeout(connect, delay);
          }
        };
      } catch (err) {
        console.warn('[SSE] No se pudo conectar al canal de eventos:', err.message);
      }
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  return { notification, dismissNotification };
}
