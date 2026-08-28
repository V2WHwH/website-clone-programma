// Preload: veilige brug tussen renderer en hoofdproces (contextIsolation aan).
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hwhDesktop', {
  // De Studio kiest hiermee de <webview>-weg voor de webcontent-module.
  webviewAvailable: true,
  getDiagnostics: () => ipcRenderer.invoke('diagnostics:get'),
  openLogs: () => ipcRenderer.invoke('diagnostics:openLogs'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch)
});
