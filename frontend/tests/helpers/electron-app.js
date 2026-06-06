/**
 * Helper para tests E2E con Electron + Playwright.
 *
 * Levanta la app Electron con un backend mock (json-server style o
 * in-process express), y expone helpers para interactuar con el
 * main process a través del contextBridge expuesto en `window.electronAPI`.
 *
 *   const { launchElectronApp } = require('./helpers/electron-app');
 *   const { window, electronApp } = await launchElectronApp({ mockBackend: true });
 *
 *   const result = await window.evaluate(() =>
 *     window.electronAPI.openExternalBrowser('file:///C:/secret.txt')
 *   );
 *   // result: { opened: false, reason: 'scheme_not_allowed' }
 */

'use strict';

const path = require('path');
const { _electron: electron } = require('@playwright/test');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', 'public');
const BACKEND_ROOT = path.resolve(__dirname, '..', '..', '..', 'backend');

async function launchElectronApp({ mockBackend = true, timeout = 30000 } = {}) {
  const electronApp = await electron.launch({
    args: [
      path.join(FRONTEND_ROOT, 'electron.js'),
      '--no-sandbox',
    ],
    env: {
      ...process.env,
      HANDLER_E2E_MODE: '1',
      HANDLER_MOCK_BACKEND: mockBackend ? '1' : '0',
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
    },
    timeout,
  });

  const window = await electronApp.firstWindow({ timeout });
  await window.waitForLoadState('domcontentloaded', { timeout });

  return { electronApp, window };
}

async function closeElectronApp(electronApp) {
  if (electronApp) {
    await electronApp.close();
  }
}

async function getElectronMainProcess(electronApp) {
  return electronApp.evaluate(async ({ app, BrowserWindow, ipcMain }) => {
    return { app, BrowserWindow, ipcMain };
  });
}

module.exports = {
  launchElectronApp,
  closeElectronApp,
  getElectronMainProcess,
  FRONTEND_ROOT,
  BACKEND_ROOT,
};
