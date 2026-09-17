// Preload: veilige brug tussen renderer en hoofdproces (contextIsolation aan).
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hwhDesktop', {
  // De Studio kiest hiermee de <webview>-weg voor de webcontent-module.
  webviewAvailable: true,
  // Levenstekens voor de watchdog + melding bij een eigen herstart.
  heartbeat: () => ipcRenderer.send('health:beat'),
  notifyRestart: (reason) => ipcRenderer.send('health:restart', String(reason || '')),
  restart: (reason) => ipcRenderer.send('health:hardRestart', String(reason || '')),
  getDiagnostics: () => ipcRenderer.invoke('diagnostics:get'),
  openLogs: () => ipcRenderer.invoke('diagnostics:openLogs'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  // Logo van een website opzoeken. Alleen het hoofdproces kan de pagina
  // ophalen: een browser mag de inhoud van een vreemde site niet lezen.
  findLogo: (url) => ipcRenderer.invoke('web:findLogo', String(url || ''))
});
