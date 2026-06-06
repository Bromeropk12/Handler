const { app, BrowserWindow, Menu, session, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, execFile } = require('child_process');
const security = require('./security');

const isDev = process.env.ELECTRON_DEV === 'true' || !app.isPackaged;
const APP_URL = process.env.HANDLER_APP_URL || 'http://localhost:3001';

if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

let mainWindow = null;
let adminWindow = null;
const programDataPath = path.join(process.env.ALLUSERSPROFILE || 'C:\\ProgramData', 'HandlerTrackSamples');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Handler TrackSamples',
    icon: path.join(__dirname, 'logo.png'),
    backgroundColor: '#0b0f19',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  Menu.setApplicationMenu(buildMenu());

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Handler] did-fail-load:', errorCode, errorDescription);
  });

  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(APP_URL).catch(err => {
    console.error('[Handler] Error al cargar app web:', err && err.message);
    mainWindow.loadFile(path.join(__dirname, 'admin_panel.html')).catch(e => {
      console.error('[Handler] Fallback admin_panel.html tambien fallo:', e && e.message);
    });
  });
}

function createAdminWindow() {
  if (adminWindow) {
    adminWindow.focus();
    return;
  }

  adminWindow = new BrowserWindow({
    width: 950,
    height: 650,
    minWidth: 900,
    minHeight: 600,
    title: 'Handler TrackSamples — Panel de Administración',
    icon: path.join(__dirname, 'logo.png'),
    backgroundColor: '#070913',
    parent: mainWindow,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  adminWindow.setMenu(null);
  adminWindow.loadFile(path.join(__dirname, 'admin_panel.html')).catch(err => {
    console.error('[Handler] Error al cargar admin panel:', err && err.message);
  });

  adminWindow.once('ready-to-show', () => {
    adminWindow.show();
    adminWindow.focus();
  });

  adminWindow.on('closed', () => {
    adminWindow = null;
  });
}

function buildMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Panel de Administración',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => createAdminWindow(),
        },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar Recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollo' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Abrir en Navegador',
          click: () => {
            // (C5) shell.openExternal debe pasar por whitelist. APP_URL
            // es un valor interno controlado por el main process, pero
            // usamos el helper seguro para tener un solo punto de control.
            security.safeOpenExternal(shell, APP_URL);
          },
        },
        {
          label: 'Acerca de',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Handler TrackSamples',
              message: 'Handler TrackSamples v1.0.0',
              detail: 'Servidor LAN Headless para gestion de muestras quimicas.\n\n' +
                      'URL: ' + APP_URL + '\n' +
                      'Servicio: HandlerTrackSamples (Windows Service)',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ]);
}

/**
 * (H9) Helper para validar que un IPC event viene de una BrowserWindow
 * conocida de la app. Rechaza cualquier sender que no sea file://, devtools://,
 * o la APP_URL del backend LAN.
 */
function isTrustedSender(event) {
  const url = event.senderFrame ? event.senderFrame.url : '';
  if (!url) return false;
  if (url.startsWith('file://')) return true;
  if (url.startsWith('devtools://')) return true;
  if (url.startsWith(APP_URL)) return true;
  console.warn(`[SECURITY] IPC rejected from untrusted sender: ${url}`);
  return false;
}

ipcMain.handle('get-service-status', async (event) => {
  // (H9) Validar sender
  if (!isTrustedSender(event)) {
    return 'STOPPED';
  }
  return new Promise((resolve) => {
    exec('sc query HandlerTrackSamples', { shell: false }, (error, stdout) => {
      const out = (stdout || '').toLowerCase();
      if (error && (out.includes('1060') || out.includes('does not exist') || out.includes('no existe'))) {
        return resolve('NOT_INSTALLED');
      }
      if (out.includes('running') || out.includes('en ejecuci')) return resolve('RUNNING');
      if (out.includes('start_pending') || out.includes('inicio_pendiente')) return resolve('STARTING');
      if (out.includes('stop_pending') || out.includes('detenci')) return resolve('STOPPING');
      if (out.includes('stopped') || out.includes('detenido')) return resolve('STOPPED');
      const nssmPath = path.join(path.dirname(process.execPath), 'resources', 'backend', 'nssm.exe');
      const nssmCmd = fs.existsSync(nssmPath)
        ? `"${nssmPath}" status HandlerTrackSamples`
        : 'nssm status HandlerTrackSamples';
      exec(nssmCmd, { shell: false }, (err2, out2) => {
        const o = (out2 || '').toLowerCase().trim();
        if (o.includes('running')) return resolve('RUNNING');
        if (o.includes('start')) return resolve('STARTING');
        if (o.includes('stop') && o.includes('pending')) return resolve('STOPPING');
        if (o.includes('stopped') || o.includes('detenido')) return resolve('STOPPED');
        resolve('STOPPED');
      });
    });
  });
});

ipcMain.handle('control-service', async (event, action) => {
  // (H8) execFile con array de args en lugar de exec con shell:true.
  // (H9) Validar que el sender sea una BrowserWindow conocida.
  const senderUrl = event.senderFrame ? event.senderFrame.url : '';
  if (!senderUrl.startsWith('file://') && !senderUrl.startsWith('devtools://') && !senderUrl.startsWith(APP_URL)) {
    console.warn(`[SECURITY] control-service rejected: untrusted sender ${senderUrl}`);
    return { success: false, error: 'untrusted_sender' };
  }

  if (!security.ALLOWED_SERVICE_ACTIONS.has(action)) {
    return { success: false, error: 'Accion invalida' };
  }

  const commandSpec = security.buildServiceCommand(action);
  if (!commandSpec) {
    return { success: false, error: 'Accion no soportada' };
  }

  // Si es restart, ejecutamos stop y start secuencialmente.
  if (action === 'restart') {
    return new Promise((resolve) => {
      const runNext = (specs, index, results) => {
        if (index >= specs.length) {
          const allOk = results.every((r) => r.success);
          return resolve({ success: allOk, results });
        }
        const spec = specs[index];
        execFile(spec.cmd, spec.args, { shell: false }, (error, stdout, stderr) => {
          results.push(handleServiceResult(error, stdout, stderr));
          runNext(specs, index + 1, results);
        });
      };
      runNext(commandSpec, 0, []);
    });
  }

  return new Promise((resolve) => {
    execFile(commandSpec.cmd, commandSpec.args, { shell: false }, (error, stdout, stderr) => {
      resolve(handleServiceResult(error, stdout, stderr));
    });
  });
});

function handleServiceResult(error, stdout, stderr) {
  if (!error) return { success: true };
  const combined = (stdout + stderr).toLowerCase();
  if (combined.includes('2182') || combined.includes('ya ha sido iniciado') || combined.includes('already been started')) {
    return { success: true, warning: 'El servicio ya estaba en ejecucion.' };
  }
  if (combined.includes('2184') || combined.includes('no ha sido iniciado') || combined.includes('not been started')) {
    return { success: true, warning: 'El servicio ya estaba detenido.' };
  }
  if (combined.includes(' 5 ') || combined.includes('denegado') || combined.includes('access is denied')) {
    return { success: false, error: 'Acceso Denegado. Ejecute Handler como Administrador para controlar el servicio.' };
  }
  return { success: false, error: (stderr || stdout || error.message).trim() };
}

ipcMain.handle('get-latest-logs', async (event) => {
  if (!isTrustedSender(event)) {
    return 'Acceso denegado: sender no confiable.';
  }
  try {
    const logsDir = path.join(programDataPath, 'logs');
    if (!fs.existsSync(logsDir)) return 'No hay registros disponibles aun. El servidor debe iniciarse primero.';
    const files = fs.readdirSync(logsDir).filter(f => f.startsWith('combined-') && f.endsWith('.log')).sort();
    if (files.length === 0) return 'No hay archivos de registros disponibles.';
    const latestLogFile = path.join(logsDir, files[files.length - 1]);
    const logsContent = fs.readFileSync(latestLogFile, 'utf8');
    const lines = logsContent.split('\n').filter(Boolean);
    return lines.slice(-50).map(line => {
      try {
        const logObj = JSON.parse(line);
        const date = logObj.timestamp ? new Date(logObj.timestamp).toLocaleTimeString() : '';
        const level = logObj.level ? `[${logObj.level.toUpperCase()}]` : '';
        return `${date} ${level} ${logObj.message || ''}`;
      } catch (_) { return line; }
    }).join('\n');
  } catch (err) {
    return `Error leyendo logs: ${err.message}`;
  }
});

ipcMain.handle('get-network-info', async (event) => {
  if (!isTrustedSender(event)) {
    return { addresses: [], port: 3001, protocol: 'http' };
  }
  const os = require('os');
  const addresses = [];
  for (const interfaceName of Object.keys(os.networkInterfaces())) {
    for (const iface of os.networkInterfaces()[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ interface: interfaceName, ip: iface.address });
      }
    }
  }
  const sslDir = path.join(programDataPath, 'ssl');
  const hasCert = fs.existsSync(path.join(sslDir, 'ca.crt'));
  const ips = addresses.map(a => a.ip);
  ips.addresses = addresses;
  ips.port = 3001;
  ips.protocol = hasCert ? 'https' : 'http';
  return ips;
});

ipcMain.on('open-external-browser', async (event, url) => {
  // (C5) Validar URL contra whitelist antes de abrir externamente.
  // (H9) Validar que el sender sea una BrowserWindow conocida de
  //      nuestra app (no un WebContents arbitrario).
  const sender = event.senderFrame
    ? event.senderFrame.url
    : 'unknown';
  const trustedOrigins = new Set([APP_URL, 'file://']);
  let senderTrusted = false;
  try {
    const u = new URL(sender);
    senderTrusted = trustedOrigins.has(`${u.protocol}//${u.host}`) ||
      sender.startsWith('file://') ||
      sender.startsWith('devtools://');
  } catch (_) {}

  if (!senderTrusted) {
    console.warn(`[SECURITY] open-external-browser rejected: untrusted sender ${sender}`);
    event.returnValue = { opened: false, reason: 'untrusted_sender' };
    return;
  }

  const result = await security.safeOpenExternal(shell, url);
  event.returnValue = result;
});

ipcMain.handle('notify-restart', async (event, minutesUntilRestart = 2) => {
  // (H9 + param encoding) Validar sender + encodeURIComponent
  if (!isTrustedSender(event)) {
    return { success: false, error: 'untrusted_sender' };
  }
  // Validar que minutes es un número finito positivo
  const safeMinutes = Number.isFinite(minutesUntilRestart) && minutesUntilRestart > 0 && minutesUntilRestart <= 60
    ? Math.floor(minutesUntilRestart)
    : 2;
  try {
    const http = require('http');
    const options = { hostname: '127.0.0.1', port: 3001, path: `/api/admin/notify-restart?minutes=${encodeURIComponent(safeMinutes)}`, method: 'POST' };
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => resolve({ success: res.statusCode === 200, status: res.statusCode }));
      req.on('error', e => reject(new Error(e.message)));
      req.setTimeout(4000, () => { req.destroy(); reject(new Error('timeout')); });
      req.end();
    });
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('notify-update', async (event, version = '') => {
  if (!isTrustedSender(event)) {
    return { success: false, error: 'untrusted_sender' };
  }
  try {
    const http = require('http');
    const options = { hostname: '127.0.0.1', port: 3001, path: `/api/admin/notify-update?version=${encodeURIComponent(version)}`, method: 'POST' };
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => resolve({ success: res.statusCode === 200, status: res.statusCode }));
      req.on('error', e => reject(new Error(e.message)));
      req.setTimeout(4000, () => { req.destroy(); reject(new Error('timeout')); });
      req.end();
    });
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('get-sse-client-count', async (event) => {
  if (!isTrustedSender(event)) {
    return { count: 0 };
  }
  try {
    const http = require('http');
    const options = { hostname: '127.0.0.1', port: 3001, path: '/api/admin/sse-count', method: 'GET' };
    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch (_) { resolve({ count: 0 }); } });
      });
      req.on('error', () => resolve({ count: 0 }));
      req.setTimeout(3000, () => { req.destroy(); resolve({ count: 0 }); });
      req.end();
    });
  } catch (_) { return { count: 0 }; }
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    const ses = session.defaultSession;

    const ALLOWED_PERMISSIONS = new Set([
      'media',              // cámara/micrófono para escaneo de QR
      'mediaKeySystem',     // DRM (no usado pero inofensivo)
      'notifications',      // notificaciones nativas
    ]);

    ses.setPermissionCheckHandler((_wc, permission) => {
      return ALLOWED_PERMISSIONS.has(permission);
    });

    ses.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(ALLOWED_PERMISSIONS.has(permission));
    });

    createMainWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
}