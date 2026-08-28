// HereWeHolo Player — Electron-hoofdproces.
// Draait de Studio-app als volwaardige Windows-desktopapplicatie:
// kioskmodus, GPU-versnelling, hardwaredetectie, structured logging met
// rotatie, crash-herstel en een diagnosticsvenster.
'use strict';

const { app, BrowserWindow, ipcMain, globalShortcut, shell, dialog, session } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SMOKE_TEST = process.argv.includes('--smoke-test');
const APP_URL = 'file://' + path.join(__dirname, 'app', 'index.html');

/* ---------------- Instellingen (atomic writes) ---------------- */

const defaultSettings = {
  kiosk: true,                  // fullscreen zonder vensterrand (F11 wisselt)
  hardwareAcceleration: true,   // GPU aan; uitzetten forceert CPU-rendering
  zoomFactor: 1.0
};
let settings = { ...defaultSettings };
let settingsPath;

function loadSettings() {
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    settings = { ...defaultSettings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
  } catch { /* eerste start: defaults */ }
}

function saveSettings() {
  try {
    const tmp = settingsPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(settings, null, 2));
    fs.renameSync(tmp, settingsPath);
  } catch (e) {
    log('warn', 'settings-save-failed', { error: String(e) });
  }
}

/* ---------------- Structured logging met rotatie ---------------- */

const LOG_MAX_BYTES = 5 * 1024 * 1024;
const LOG_KEEP = 5;
let logDir, logFile;

function initLogging() {
  logDir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  logFile = path.join(logDir, 'player.log');
  rotateIfNeeded();
}

function rotateIfNeeded() {
  try {
    if (fs.existsSync(logFile) && fs.statSync(logFile).size > LOG_MAX_BYTES) {
      for (let i = LOG_KEEP - 1; i >= 1; i--) {
        const from = `${logFile}.${i}`;
        if (fs.existsSync(from)) fs.renameSync(from, `${logFile}.${i + 1}`);
      }
      fs.renameSync(logFile, logFile + '.1');
      const overflow = `${logFile}.${LOG_KEEP + 1}`;
      if (fs.existsSync(overflow)) fs.unlinkSync(overflow);
    }
  } catch { /* logging mag de app nooit breken */ }
}

function log(level, event, data = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...data });
  try {
    rotateIfNeeded();
    fs.appendFileSync(logFile, line + '\n');
  } catch { /* stil falen */ }
  if (level === 'error' || SMOKE_TEST) console.log(line);
}

/* ---------------- GPU-configuratie ----------------
   Voor de app-start: hardwareversnelling en video-decode zo agressief
   mogelijk aanzetten; Chromium valt zelf terug op CPU waar nodig. */

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-features', 'PlatformHEVCDecoderSupport');

// hardwareAcceleration=false in settings.json → volledige CPU-fallback.
// (settings zijn hier nog niet geladen; lees het bestand direct, vóór ready.)
try {
  const early = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'settings.json'), 'utf8'));
  if (early.hardwareAcceleration === false) {
    app.disableHardwareAcceleration();
  }
} catch { /* defaults */ }

/* ---------------- Hardwaredetectie ---------------- */

async function collectHardwareInfo() {
  const info = {
    app: { name: 'HereWeHolo Player', version: app.getVersion() },
    runtime: { electron: process.versions.electron, chromium: process.versions.chrome, node: process.versions.node },
    os: { platform: process.platform, release: os.release(), arch: process.arch },
    cpu: { model: os.cpus()[0]?.model || 'onbekend', logicalCores: os.cpus().length },
    ramGB: Math.round(os.totalmem() / 1e9),
    gpuFeatures: null,
    gpu: null
  };
  try {
    info.gpuFeatures = app.getGPUFeatureStatus();
    const gpu = await app.getGPUInfo('complete');
    info.gpu = {
      devices: (gpu.gpuDevice || []).map((d) => ({ vendorId: d.vendorId, deviceId: d.deviceId, active: d.active, name: d.deviceString || null })),
      auxAttributes: gpu.auxAttributes ? {
        glRenderer: gpu.auxAttributes.glRenderer,
        isHardwareAccelerated: gpu.auxAttributes.isHardwareAccelerated ?? null
      } : null,
      machineModelName: gpu.machineModelName || null
    };
  } catch (e) {
    info.gpuError = String(e);
  }
  return info;
}

/* ---------------- Hoofdvenster ---------------- */

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: settings.kiosk,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      backgroundThrottling: false,
      // De webcontent-module gebruikt in de desktop-app een <webview>:
      // die kan élke site tonen, ook sites die inline-embedding (iframe)
      // met X-Frame-Options/CSP weigeren.
      webviewTag: true
    }
  });
  win.setMenuBarVisibility(false);
  win.webContents.on('will-attach-webview', (event, webPreferences) => {
    delete webPreferences.preload;          // geen scripts van ons in externe sites
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
  });
  win.loadURL(APP_URL);
  win.once('ready-to-show', () => {
    win.show();
    if (settings.zoomFactor !== 1.0) win.webContents.setZoomFactor(settings.zoomFactor);
  });

  // Crash-herstel: rendererproces weg → loggen en venster herladen.
  win.webContents.on('render-process-gone', (e, details) => {
    log('error', 'render-process-gone', { reason: details.reason, exitCode: details.exitCode });
    if (details.reason !== 'clean-exit' && win && !win.isDestroyed()) {
      recover('render-process-gone: ' + details.reason);
    }
  });

  // Vastgelopen rendermodule: Chromium meldt dit zelf.
  win.on('unresponsive', () => {
    log('error', 'venster reageert niet — herstellen');
    recover('venster reageerde niet');
  });
  win.on('responsive', () => log('info', 'venster reageert weer'));

  // Hartslag opnieuw starten na elke (her)lading van de pagina.
  win.webContents.on('did-finish-load', () => { lastBeat = Date.now(); });

  // Externe links (bijv. uit het Help-tabblad) in de systeembrowser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('closed', () => { win = null; });
}

/* ---------------- Watchdog & onderhoud (24/7-bedrijf) ----------------
   De Studio stuurt elke seconde een hartslag. Blijft die weg, dan is de
   rendermodule vastgelopen: eerst herladen, en helpt dat niet, dan de
   applicatie volledig herstarten. Daarnaast wordt de HTTP/GPU-cache
   periodiek geleegd en het geheugen bewaakt. */

let lastBeat = Date.now();
let recovering = false;
let reloadAttempts = 0;
let lastRecoverAt = 0;

ipcMain.on('health:beat', () => { lastBeat = Date.now(); });
ipcMain.on('health:restart', (e, reason) => {
  log('warn', 'app herstart zichzelf', { reason });
  lastBeat = Date.now();          // eigen herstart is geen vastloper
});

// De Studio vraagt om een echte herstart (geheugen, watchdog, nachtrondje).
ipcMain.on('health:hardRestart', (e, reason) => {
  log('warn', 'herstart aangevraagd door de presentatie', { reason });
  if (!win || win.isDestroyed()) return;
  lastBeat = Date.now();
  const nightly = /nachtelijke/i.test(reason || '');
  if (nightly) {                 // preventief: volledige, schone herstart
    app.relaunch();
    setTimeout(() => app.exit(0), 500);
  } else {
    try { win.reload(); } catch { app.relaunch(); app.exit(0); }
  }
});

function recover(reason) {
  if (recovering || !win || win.isDestroyed()) return;
  recovering = true;
  const sinceLast = Date.now() - lastRecoverAt;
  if (sinceLast > 10 * 60000) reloadAttempts = 0;   // ver uit elkaar = losse incidenten
  lastRecoverAt = Date.now();
  reloadAttempts++;
  log('error', 'herstel gestart', { reason, poging: reloadAttempts });
  if (reloadAttempts <= 2) {
    try { win.webContents.forcefullyCrashRenderer(); } catch {}
    setTimeout(() => {
      try { win.reload(); } catch {}
      lastBeat = Date.now();
      recovering = false;
    }, 800);
  } else {
    log('error', 'herladen hielp niet — applicatie wordt herstart');
    app.relaunch();
    setTimeout(() => app.exit(0), 600);
  }
}

// Watchdog: elke 5 s controleren of de hartslag nog binnenkomt.
setInterval(() => {
  if (!win || win.isDestroyed()) return;
  const gap = (Date.now() - lastBeat) / 1000;
  if (gap > 30) {
    log('error', 'geen hartslag', { seconden: Math.round(gap) });
    recover('geen hartslag gedurende ' + Math.round(gap) + 's');
  }
}, 5000);

// Onderhoud: cache legen en geheugen bewaken. Chromium houdt bij langdurig
// videogebruik veel cache aan; periodiek legen voorkomt trage weergave.
setInterval(async () => {
  if (!win || win.isDestroyed()) return;
  try {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearCodeCaches({ urls: [] });
    log('info', 'onderhoud: cache geleegd');
  } catch (err) { log('warn', 'cache legen mislukt', { err: String(err) }); }
}, 6 * 3600 * 1000);

// Geheugenbewaking van het hoofdproces + rendermodule.
setInterval(async () => {
  if (!win || win.isDestroyed()) return;
  try {
    const metrics = app.getAppMetrics();
    const totalMb = metrics.reduce((a, m) => a + (m.memory?.workingSetSize || 0), 0) / 1024;
    if (totalMb > 2600) {
      log('error', 'geheugengebruik hoog — venster verversen', { mb: Math.round(totalMb) });
      win.reload();
      lastBeat = Date.now();
    } else if (totalMb > 1800) {
      log('warn', 'geheugengebruik loopt op', { mb: Math.round(totalMb) });
      try { await session.defaultSession.clearCache(); } catch {}
    }
  } catch (err) { log('warn', 'geheugenmeting mislukt', { err: String(err) }); }
}, 10 * 60000);

/* ---------------- Diagnosticsvenster ---------------- */

let diagWin = null;

function openDiagnostics() {
  if (diagWin && !diagWin.isDestroyed()) return diagWin.focus();
  diagWin = new BrowserWindow({
    width: 720,
    height: 760,
    title: 'HereWeHolo Player — Diagnostiek',
    autoHideMenuBar: true,
    backgroundColor: '#0c1118',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  diagWin.loadFile(path.join(__dirname, 'diagnostics.html'));
  diagWin.on('closed', () => { diagWin = null; });
}

/* ---------------- IPC ---------------- */

ipcMain.handle('diagnostics:get', async () => {
  const hw = await collectHardwareInfo();
  return { ...hw, settings, logDir, uptimeSec: Math.round(process.uptime()) };
});
ipcMain.handle('diagnostics:openLogs', () => shell.openPath(logDir));
ipcMain.handle('settings:set', (e, patch) => {
  const allowed = ['kiosk', 'hardwareAcceleration', 'zoomFactor'];
  for (const k of allowed) if (patch[k] !== undefined) settings[k] = patch[k];
  saveSettings();
  log('info', 'settings-changed', { settings });
  return settings;
});

/* ---------------- App-lifecycle ---------------- */

// Eén instantie: een tweede start focust het bestaande venster.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(async () => {
    loadSettings();
    initLogging();

    // Webcam-toestemming expliciet toestaan voor de eigen app-pagina's
    // (aanwezigheidsdetectie). Windows-privacy-instellingen kunnen camera-
    // toegang voor apps alsnog blokkeren; dat logt de renderer zelf.
    session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
      callback(permission === 'media' || permission === 'fullscreen' || permission === 'pointerLock');
    });
    session.defaultSession.setPermissionCheckHandler((wc, permission) =>
      permission === 'media' || permission === 'fullscreen' || permission === 'pointerLock');
    log('info', 'startup', { version: app.getVersion(), electron: process.versions.electron, argv: process.argv.slice(1) });

    const hw = await collectHardwareInfo();
    log('info', 'hardware-detected', hw);
    try {
      fs.writeFileSync(path.join(logDir, 'hardware.json'), JSON.stringify(hw, null, 2));
    } catch { /* niet kritiek */ }

    // Smoke-test (CI): initialisatie + hardwaredetectie bewijzen, dan stoppen.
    if (SMOKE_TEST) {
      const out = { ok: true, version: app.getVersion(), gpuFeatures: hw.gpuFeatures, cpu: hw.cpu, ramGB: hw.ramGB };
      fs.writeFileSync(path.join(process.cwd(), 'smoke-result.json'), JSON.stringify(out, null, 2));
      console.log('SMOKE-TEST OK');
      app.exit(0);
      return;
    }

    createWindow();

    // Sneltoetsen: F11 kiosk aan/uit, Ctrl+Shift+D diagnostiek, Ctrl+Shift+L logs.
    globalShortcut.register('F11', () => {
      if (!win) return;
      settings.kiosk = !win.isFullScreen();
      win.setFullScreen(settings.kiosk);
      saveSettings();
    });
    globalShortcut.register('CommandOrControl+Shift+D', openDiagnostics);
    globalShortcut.register('CommandOrControl+Shift+L', () => shell.openPath(logDir));
  });

  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    log('info', 'shutdown', { uptimeSec: Math.round(process.uptime()) });
  });

  process.on('uncaughtException', (err) => {
    try { log('error', 'uncaught-exception', { error: String(err), stack: err.stack }); } catch {}
    if (!SMOKE_TEST && app.isReady()) {
      dialog.showErrorBox('HereWeHolo Player', 'Er is een onverwachte fout opgetreden. Details staan in het logbestand (Ctrl+Shift+L).');
    }
  });
}
