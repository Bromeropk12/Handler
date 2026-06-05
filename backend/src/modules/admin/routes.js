/**
 * Rutas de administración interna — solo accesibles desde localhost.
 * Expone endpoints para que el Panel Electron dispare notificaciones SSE.
 */
const express = require('express');
const router = express.Router();
const sseService = require('../../services/sseService');

// Middleware: Solo localhost puede llamar estas rutas
function localhostOnly(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '';
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (!isLocal) {
    return res.status(403).json({ error: 'Acceso restringido a localhost' });
  }
  next();
}

// POST /api/admin/notify-restart?minutes=2
router.post('/notify-restart', localhostOnly, (req, res) => {
  const minutes = parseInt(req.query.minutes, 10) || 2;
  sseService.notifyRestart(minutes);
  res.json({ success: true, clients: sseService.getClientCount(), minutes });
});

// POST /api/admin/notify-update?version=1.2.0
router.post('/notify-update', localhostOnly, (req, res) => {
  const version = req.query.version || 'nueva';
  sseService.notifyUpdate(version);
  res.json({ success: true, clients: sseService.getClientCount(), version });
});

// GET /api/admin/sse-count
router.get('/sse-count', localhostOnly, (req, res) => {
  res.json({ count: sseService.getClientCount() });
});

module.exports = router;
