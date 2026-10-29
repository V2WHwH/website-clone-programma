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
  // "Naar Windows" in het menu: de app afsluiten.
  quit: () => ipcRenderer.send('app:quit'),
  getDiagnostics: () => ipcRenderer.invoke('diagnostics:get'),
  openLogs: () => ipcRenderer.invoke('diagnostics:openLogs'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  // Logo van een website opzoeken. Alleen het hoofdproces kan de pagina
  // ophalen: een browser mag de inhoud van een vreemde site niet lezen.
  findLogo: (url) => ipcRenderer.invoke('web:findLogo', String(url || '')),
  // Hoog geheugengebruik: de presentatie kiest zelf een rustig moment om te herstarten.
  onGeheugenHoog: (fn) => ipcRenderer.on('health:geheugenHoog', (e, mb) => fn(Number(mb) || 0))
});
