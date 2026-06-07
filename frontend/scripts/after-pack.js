// Hook electron-builder: se ejecuta DESPUÉS de crear win-unpacked/
// pero ANTES de empaquetar el instalador NSIS.
// Embebe el icono BMP-encoded en el .exe principal usando rcedit.
//
// electron-builder con signAndEditExecutable:false NO embebe el icono
// por defecto. Sin este hook, el .exe sale con el icono default de
// Electron y los accesos directos del escritorio y taskbar muestran
// el icono equivocado.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

exports.default = async function (context) {
  // Solo aplica para Windows.
  if (context.electronPlatformName !== 'win32') return;

  const icoPath = path.join(__dirname, '..', 'public', 'icon.ico');
  const exePath = path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.exe`
  );

  if (!fs.existsSync(icoPath)) {
    console.warn(`[afterPack] ICO no encontrado: ${icoPath}`);
    return;
  }
  if (!fs.existsSync(exePath)) {
    console.warn(`[afterPack] EXE no encontrado: ${exePath}`);
    return;
  }

  // Localizar rcedit-x64.exe en el cache de electron-builder
  const localAppData =
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const candidates = [
    path.join(localAppData, 'electron-builder', 'Cache', 'winCodeSign', 'winCodeSign-2.6.0', 'rcedit-x64.exe'),
    path.join(localAppData, 'electron-builder', 'Cache', 'winCodeSign', 'rcedit-x64.exe'),
  ];

  let rceditPath = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) { rceditPath = c; break; }
  }

  if (!rceditPath) {
    console.warn('[afterPack] rcedit-x64.exe no encontrado, saltando.');
    console.warn('[afterPack] Icono de taskbar/shortcut puede no aparecer.');
    return;
  }

  const sizeBefore = fs.statSync(exePath).size;
  console.log(`[afterPack] EXE antes: ${(sizeBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`[afterPack] Embebiendo icono BMP-encoded...`);

  try {
    execFileSync(rceditPath, [exePath, '--set-icon', icoPath], { stdio: 'inherit' });
    const sizeAfter = fs.statSync(exePath).size;
    console.log(`[afterPack] EXE después: ${(sizeAfter / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[afterPack] OK (Δ +${((sizeAfter - sizeBefore) / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error('[afterPack] Error al embeber icono:', err.message);
    // No fatal: NSIS installer se crea igual, pero sin icono embebido
  }
};
