const { app, BrowserWindow, Menu, session, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

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
    icon: path.join(__dirname, 'icon.png'),
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

  // Interceptar enlaces target="_blank" (como el visor de PDF de CoA)
  // para que se abran en el navegador web predeterminado del sistema (Chrome, Edge, etc.)
  // Esto previene crashes de Electron al intentar inyectar preload.js en el visor PDF interno.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
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
    icon: path.join(__dirname, 'icon.png'),
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
          click: () => shell.openExternal(APP_URL),
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

ipcMain.handle('get-service-status', async () => {
  return new Promise((resolve) => {
    exec('sc query HandlerTrackSamples', (error, stdout) => {
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
      exec(nssmCmd, (err2, out2) => {
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
  return new Promise((resolve) => {
    let cmd = '';
    if (action === 'start') cmd = 'net start HandlerTrackSamples';
    else if (action === 'stop') cmd = 'net stop HandlerTrackSamples';
    else if (action === 'restart') cmd = 'net stop HandlerTrackSamples 2>nul & net start HandlerTrackSamples';
    else return resolve({ success: false, error: 'Accion invalida' });

    exec(cmd, { shell: true }, (error, stdout, stderr) => {
      if (error) {
        const combined = (stdout + stderr).toLowerCase();
        if (combined.includes('2182') || combined.includes('ya ha sido iniciado') || combined.includes('already been started')) {
          return resolve({ success: true, warning: 'El servicio ya estaba en ejecucion.' });
        }
        if (combined.includes('2184') || combined.includes('no ha sido iniciado') || combined.includes('not been started')) {
          return resolve({ success: true, warning: 'El servicio ya estaba detenido.' });
        }
        if (combined.includes(' 5 ') || combined.includes('denegado') || combined.includes('access is denied')) {
          return resolve({ success: false, error: 'Acceso Denegado. Ejecute Handler como Administrador para controlar el servicio.' });
        }
        return resolve({ success: false, error: stderr.trim() || stdout.trim() || error.message });
      }
      resolve({ success: true });
    });
  });
});

ipcMain.handle('get-latest-logs', async () => {
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

ipcMain.handle('get-network-info', async () => {
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

ipcMain.on('open-external-browser', (event, url) => shell.openExternal(url));

ipcMain.handle('notify-restart', async (event, minutesUntilRestart = 2) => {
  try {
    const http = require('http');
    const options = { hostname: '127.0.0.1', port: 3001, path: `/api/admin/notify-restart?minutes=${minutesUntilRestart}`, method: 'POST' };
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => resolve({ success: res.statusCode === 200, status: res.statusCode }));
      req.on('error', e => reject(new Error(e.message)));
      req.setTimeout(4000, () => { req.destroy(); reject(new Error('timeout')); });
      req.end();
    });
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('notify-update', async (event, version = '') => {
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

ipcMain.handle('get-sse-client-count', async () => {
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

// ─── Setup / Configuración inicial ───────────────────────────────────────
ipcMain.handle('check-setup', async () => {
  return fs.existsSync(prodEnvPath);
});

// Selector nativo de archivos (para el CoA)
ipcMain.handle('select-file', async (event, options = {}) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar Archivo PDF (CoA)',
    properties: ['openFile'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
    ...options
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('open-local-file', async (event, filePath) => {
  if (!filePath) return false;
  const result = await shell.openPath(filePath);
  return result === ''; // openPath returns an empty string on success
});

ipcMain.handle('setup-database', async (_event, formData) => {
  try {
    const http = require('http');
    const data = JSON.stringify(formData);
    return new Promise((resolve) => {
      const req = http.request({
        hostname: '127.0.0.1', port: 3001,
        path: '/api/setup', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      }, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (_) { resolve({ success: false, error: 'Respuesta inválida del servidor' }); }
        });
      });
      req.on('error', e => resolve({ success: false, error: e.message }));
      req.setTimeout(30000, () => { req.destroy(); resolve({ success: false, error: 'Tiempo de espera agotado' }); });
      req.write(data);
      req.end();
    });
  } catch (err) { return { success: false, error: err.message }; }
});
// ────────────────────────────────────────────────────────────────────────

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