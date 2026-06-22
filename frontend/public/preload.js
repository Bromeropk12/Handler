const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Servicio Windows
  getServiceStatus:   () => ipcRenderer.invoke('get-service-status'),
  controlService:     (action) => ipcRenderer.invoke('control-service', action),
  // Logs y red
  getLatestLogs:      () => ipcRenderer.invoke('get-latest-logs'),
  getNetworkInfo:     () => ipcRenderer.invoke('get-network-info'),
  // Navegador externo
  openExternalBrowser: (url) => ipcRenderer.send('open-external-browser', url),
  // SSE Notificaciones en tiempo real
  notifyRestart:      (minutes) => ipcRenderer.invoke('notify-restart', minutes),
  notifyUpdate:       (version) => ipcRenderer.invoke('notify-update', version),
  getSseClientCount:  () => ipcRenderer.invoke('get-sse-client-count'),
  // Setup / Configuración inicial
  checkSetup:         () => ipcRenderer.invoke('check-setup'),
  setupDatabase:      (formData) => ipcRenderer.invoke('setup-database', formData),
  // Sistema de Archivos
  selectFile:         () => ipcRenderer.invoke('select-file'),
  selectFolder:       () => ipcRenderer.invoke('select-folder'),
  openLocalFile:      (filePath) => ipcRenderer.invoke('open-local-file', filePath),
});
