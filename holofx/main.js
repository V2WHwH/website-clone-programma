"use strict";

/* HoloFX — Electron-hoofdproces.
 * Start de app fullscreen (kiosk-achtig) voor holobox-displays.
 *
 * Opstart-opties (voor snelkoppelingen/autostart op de holobox):
 *   HoloFX.exe --effect=spiraal --holobox --mirror --text="MIJN TEKST"
 */

const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");

/* GPU-rasterisatie afdwingen voor vloeiende canvas-animatie */
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch("canvas-oop-rasterization");

function argValue(name) {
  const pref = `--${name}=`;
  const hit = process.argv.find(a => a.startsWith(pref));
  return hit ? hit.slice(pref.length) : null;
}
function argFlag(name) {
  return process.argv.includes(`--${name}`);
}

function buildQuery() {
  const q = new URLSearchParams();
  const effect = argValue("effect");
  const text = argValue("text");
  if (effect) q.set("effect", effect);
  if (text !== null) q.set("text", text);
  if (argFlag("holobox")) q.set("holobox", "1");
  if (argFlag("mirror")) q.set("mirror", "1");
  const s = q.toString();
  return s ? "?" + s : "";
}

let win = null;

function createWindow() {
  win = new BrowserWindow({
    fullscreen: !argFlag("windowed"),
    width: 1080,
    height: 1920,
    autoHideMenuBar: true,
    backgroundColor: "#000000",
    title: "HoloFX",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "app", "index.html"), {
    search: buildQuery(),
  });
}

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("CommandOrControl+Q", () => app.quit());
  globalShortcut.register("F11", () => {
    if (win) win.setFullScreen(!win.isFullScreen());
  });
});

app.on("window-all-closed", () => app.quit());
app.on("will-quit", () => globalShortcut.unregisterAll());
