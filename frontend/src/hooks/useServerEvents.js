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
    if (!window.location) return;

    let eventSource;
    let retryTimeout;
    let heartbeatTimeout;
    let retryCount = 0;
    const MAX_RETRIES = 10;
    const HEARTBEAT_MS = 45000;

    function clearTimers() {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
    }

    function scheduleHeartbeat() {
      if (heartbeatTimeout) clearTimeout(heartbeatTimeout);
      heartbeatTimeout = setTimeout(() => {
        console.warn('[SSE] Heartbeat perdido — forzando reconexión.');
        if (eventSource) eventSource.close();
        retryCount++;
        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        retryTimeout = setTimeout(connect, delay);
      }, HEARTBEAT_MS);
    }

    function connect() {
      clearTimers();
      try {
        eventSource = new EventSource('/api/events');

        eventSource.addEventListener('connected', () => {
          console.log('[SSE] Conectado al canal de eventos del servidor.');
          retryCount = 0;
          scheduleHeartbeat();
        });

        eventSource.addEventListener('system-restart', (e) => {
          scheduleHeartbeat();
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
          scheduleHeartbeat();
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

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'heartbeat') scheduleHeartbeat();
          } catch (_) {}
          scheduleHeartbeat(); // always reset on any valid message
        };

        eventSource.onerror = () => {
          eventSource.close();
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            const delay = Math.min(1000 * 2 ** retryCount, 30000);
            console.warn(`[SSE] Desconectado. Reintentando en ${delay / 1000}s (intento ${retryCount}/${MAX_RETRIES})...`);
            retryTimeout = setTimeout(connect, delay);
          } else {
            console.error('[SSE] Máximo de reintentos alcanzado. No se reconectará.');
          }
        };
      } catch (err) {
        console.warn('[SSE] No se pudo conectar al canal de eventos:', err.message);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const delay = Math.min(1000 * 2 ** retryCount, 30000);
          retryTimeout = setTimeout(connect, delay);
        }
      }
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      clearTimers();
    };
  }, []);

  return { notification, dismissNotification };
}
