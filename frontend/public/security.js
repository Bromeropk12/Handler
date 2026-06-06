/**
 * Helpers de seguridad para el main process de Electron.
 *
 * Centraliza la validación de URLs externas, sender de IPC, y comandos
 * shell. Cualquier handler IPC que reciba input del renderer DEBE pasar
 * por aquí.
 *
 * C5 — shell.openExternal: solo permite http(s) y hosts whitelisted.
 * H9 — IPC: solo permite senders que sean BrowserWindow conocidos
 *      (mainWindow o adminWindow) o webContents confiables.
 */

'use strict';

const path = require('path');

/**
 * Hosts permitidos para shell.openExternal. Por defecto solo la app
 * local (localhost/127.0.0.1). Se puede extender via env var
 * HANDLER_ALLOWED_EXTERNAL_HOSTS (separados por coma).
 */
function getAllowedExternalHosts() {
  const env = process.env.HANDLER_ALLOWED_EXTERNAL_HOSTS;
  const defaultHosts = ['localhost', '127.0.0.1', '::1'];
  if (!env) return new Set(defaultHosts);
  return new Set([...defaultHosts, ...env.split(',').map(s => s.trim()).filter(Boolean)]);
}

/**
 * Valida que una URL sea segura para abrir externamente.
 *
 * @param {string} url
 * @returns {{ valid: boolean, reason?: string, parsed?: URL }}
 */
function validateExternalUrl(url) {
  if (typeof url !== 'string' || url.length === 0) {
    return { valid: false, reason: 'url_not_string' };
  }
  if (url.length > 2048) {
    return { valid: false, reason: 'url_too_long' };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (_) {
    return { valid: false, reason: 'url_malformed' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: 'scheme_not_allowed', parsed };
  }

  const allowed = getAllowedExternalHosts();
  const host = parsed.hostname.toLowerCase();
  if (!allowed.has(host)) {
    return { valid: false, reason: 'host_not_whitelisted', parsed };
  }

  return { valid: true, parsed };
}

/**
 * Wrapper seguro sobre shell.openExternal. Devuelve un objeto
 * con el resultado (no lanza).
 *
 * @param {Electron.Shell} shell
 * @param {string} url
 * @returns {Promise<{ opened: boolean, reason?: string }>}
 */
async function safeOpenExternal(shell, url) {
  const check = validateExternalUrl(url);
  if (!check.valid) {
    return { opened: false, reason: check.reason };
  }
  try {
    await shell.openExternal(url);
    return { opened: true };
  } catch (err) {
    return { opened: false, reason: `open_failed: ${err.message}` };
  }
}

/**
 * Acciones permitidas para control-service. Cualquier valor fuera
 * de esta whitelist se rechaza sin invocar el shell.
 */
const ALLOWED_SERVICE_ACTIONS = new Set(['start', 'stop', 'restart', 'status']);

/**
 * Construye el comando shell para una acción de servicio. Se
 * mantiene como string hardcodeado (no user input) para evitar
 * command injection. Si en el futuro se quiere usar execFile
 * con array args, este helper se reemplaza.
 */
function buildServiceCommand(action) {
  switch (action) {
    case 'start':
      return { cmd: 'net', args: ['start', 'HandlerTrackSamples'] };
    case 'stop':
      return { cmd: 'net', args: ['stop', 'HandlerTrackSamples'] };
    case 'restart':
      // restart = stop then start; devolvemos array para que el caller
      // pueda ejecutarlo en dos pasos si quiere.
      return [
        { cmd: 'net', args: ['stop', 'HandlerTrackSamples'] },
        { cmd: 'net', args: ['start', 'HandlerTrackSamples'] },
      ];
    case 'status':
      return { cmd: 'sc', args: ['query', 'HandlerTrackSamples'] };
    default:
      return null;
  }
}

module.exports = {
  validateExternalUrl,
  safeOpenExternal,
  getAllowedExternalHosts,
  buildServiceCommand,
  ALLOWED_SERVICE_ACTIONS,
};
