/**
 * SSE (Server-Sent Events) Service — Handler TrackSamples
 * Permite notificar a todos los clientes conectados sobre eventos del servidor
 * como reinicios por mantenimiento, actualizaciones, etc.
 */

const clients = new Set();

/**
 * Suscribe una respuesta SSE al canal de eventos del servidor.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function subscribe(req, res) {
  // Cabeceras SSE estándar
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Desactiva el buffer de Nginx si lo hay
  res.flushHeaders();

  // Enviar un heartbeat inicial para confirmar la conexión
  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  clients.add(res);
  console.log(`[SSE] Cliente conectado. Total clientes: ${clients.size}`);

  // Limpiar cuando el cliente se desconecta
  req.on('close', () => {
    clients.delete(res);
    console.log(`[SSE] Cliente desconectado. Total clientes: ${clients.size}`);
  });
}

/**
 * Emite un evento a todos los clientes SSE conectados.
 * @param {string} event - Nombre del evento (ej: 'system-update', 'restart')
 * @param {object} data - Payload del evento
 */
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  let removed = 0;
  clients.forEach(res => {
    try {
      res.write(payload);
    } catch (err) {
      // Limpiar clientes con conexión rota
      clients.delete(res);
      removed++;
    }
  });
  if (removed > 0) {
    console.log(`[SSE] Se limpiaron ${removed} clientes desconectados.`);
  }
  console.log(`[SSE] Evento "${event}" enviado a ${clients.size} clientes activos.`);
}

/**
 * Notifica a todos los usuarios que el sistema se reiniciará pronto.
 * @param {number} minutesUntilRestart - Minutos hasta el reinicio
 */
function notifyRestart(minutesUntilRestart = 2) {
  broadcast('system-restart', {
    message: `El sistema se reiniciará en ${minutesUntilRestart} minuto${minutesUntilRestart !== 1 ? 's' : ''} por mantenimiento técnico. Por favor guarda tu progreso.`,
    minutesUntilRestart,
    timestamp: new Date().toISOString()
  });
}

/**
 * Notifica a todos los usuarios sobre una actualización disponible.
 */
function notifyUpdate(version) {
  broadcast('system-update', {
    message: `Actualización del sistema a la versión ${version} disponible. El servidor se reiniciará en breve.`,
    version,
    timestamp: new Date().toISOString()
  });
}

/**
 * Inicia un heartbeat periódico para mantener vivas las conexiones SSE.
 */
function startHeartbeat(intervalMs = 25000) {
  setInterval(() => {
    const payload = ': heartbeat\n\n';
    clients.forEach(res => {
      try {
        res.write(payload);
      } catch (_) {
        clients.delete(res);
      }
    });
  }, intervalMs);
}

module.exports = {
  subscribe,
  broadcast,
  notifyRestart,
  notifyUpdate,
  startHeartbeat,
  getClientCount: () => clients.size
};
