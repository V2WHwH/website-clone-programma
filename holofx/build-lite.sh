#!/usr/bin/env bash
# Bouwt de lichtgewicht Windows-versie van HoloFX (Neutralino, ~1,5 MB zip).
# Vereist: node/npm en internettoegang. Resultaat: build-lite/dist/HoloFX-win64/
set -euo pipefail
cd "$(dirname "$0")"

WORK=build-lite
rm -rf "$WORK"
mkdir -p "$WORK"
cd "$WORK"

npm init -y >/dev/null
npm install --no-audit --no-fund @neutralinojs/neu >/dev/null
npx neu create holofx >/dev/null
cd holofx

# resources vervangen door de HoloFX-app (client-lib + icoon behouden)
find resources -maxdepth 1 -type f -delete
cp ../../app/index.html resources/index.html

# Neutralino-integratie injecteren voor Ctrl+Q afsluiten
python3 - <<'EOF'
p = "resources/index.html"
s = open(p).read()
inject = """<script src="js/neutralino.js"></script>
<script>
if (window.Neutralino) {
  Neutralino.init();
  window.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key.toLowerCase() === "q") Neutralino.app.exit();
  });
}
</script>
</body>"""
s = s.replace("</body>", inject, 1)
open(p, "w").write(s)
EOF

cat > neutralino.config.json <<'EOF'
{
  "applicationId": "nl.desmond.holofx",
  "version": "1.0.0",
  "defaultMode": "window",
  "port": 23987,
  "documentRoot": "/resources/",
  "url": "/",
  "enableServer": true,
  "enableNativeAPI": true,
  "tokenSecurity": "one-time",
  "logging": { "enabled": false, "writeToLogFile": false },
  "nativeAllowList": ["app.*"],
  "modes": {
    "window": {
      "title": "HoloFX",
      "width": 1080,
      "height": 1920,
      "center": true,
      "fullScreen": true,
      "icon": "/resources/icons/appIcon.png",
      "enableInspector": false,
      "borderless": false,
      "maximize": true,
      "hidden": false,
      "resizable": true,
      "exitProcessOnClose": true
    }
  },
  "cli": {
    "binaryName": "HoloFX",
    "resourcesPath": "/resources/",
    "extensionsPath": "/extensions/",
    "clientLibrary": "/resources/js/neutralino.js",
    "binaryVersion": "nightly",
    "clientVersion": "nightly"
  }
}
EOF

npx neu build --release
mkdir -p dist/HoloFX-win64
cp dist/HoloFX/HoloFX-win_x64.exe dist/HoloFX-win64/HoloFX.exe
cp dist/HoloFX/resources.neu dist/HoloFX-win64/
echo "Klaar: $(pwd)/dist/HoloFX-win64/"
