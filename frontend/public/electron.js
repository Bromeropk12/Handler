const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('path');

// ⚠️ isDev ANTES de todo – detecta si estamos empaquetados o en desarrollo
const isDev = process.env.ELECTRON_DEV === 'true' || !app.isPackaged;

// ⚠️ Este switch DEBE estar en la parte MÁS ALTA del archivo
// (antes de cualquier app.on o whenReady). Incluye localhost Y 127.0.0.1
if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
  app.commandLine.appendSwitch(
    'unsafely-treat-insecure-origin-as-secure',
    'http://localhost:3000,http://127.0.0.1:3000'
  );
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'Handler TrackSamples',
    icon: path.join(__dirname, 'favicon.png'),
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      nodeIntegration: false,      // seguridad: no exponer Node al renderer
      contextIsolation: true,      // seguridad: aislamiento de contexto
      enableRemoteModule: false,   // obsoleto y peligroso
      // NO usar webSecurity: false ni allowRunningInsecureContent
      // El switch de arriba es suficiente para http://localhost
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // DevTools del renderer – útil para ver errores de cámara
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
  });
}

// ✅ Handlers de permisos – AMBOS son obligatorios según la doc oficial 2026
// Deben registrarse DENTRO de app.whenReady(), ANTES de crear la ventana
app.whenReady().then(() => {
  const ses = session.defaultSession;

  // 1. CheckHandler (se ejecuta primero — decide si el permiso ya fue otorgado)
  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'media') {
      console.log('[Handler] ✅ Permission CHECK - media desde:', requestingOrigin);
      return true; // permitir siempre en desarrollo
    }
    return false;
  });

  // 2. RequestHandler (se ejecuta cuando el renderer solicita el permiso)
  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    console.log('[Handler] 📌 Permission REQUEST - tipo:', permission);
    if (permission === 'media') {
      callback(true); // conceder cámara + micrófono automáticamente
    } else {
      callback(false);
    }
  });

  // Crear ventana DESPUÉS de registrar los handlers
  createWindow();
});

app.on('window-all-closed', () => {
  // En Windows y Linux: cerrar la app cuando se cierren todas las ventanas
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
