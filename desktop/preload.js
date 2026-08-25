// Preload: veilige brug tussen renderer en hoofdproces (contextIsolation aan).
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hwhDesktop', {
  getDiagnostics: () => ipcRenderer.invoke('diagnostics:get'),
  openLogs: () => ipcRenderer.invoke('diagnostics:openLogs'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch)
});
