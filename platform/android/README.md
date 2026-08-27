# HoloMe for Android (v0.1)

A native shell around the HoloMe web app: full-screen WebView, camera/microphone
permission plumbing (Android runtime permission → granted to the page, and only to the
configured platform origin), keep-screen-on, and a one-time platform-URL setup.
Everything that matters — pre-flight, GO LIVE, the honest status strip, the adaptive
ladder — is the same tested web pipeline.

## Build

```bash
sudo apt-get install aapt zipalign apksigner dalvik-exchange default-jdk imagemagick
node android/build-apk.mjs        # → dist/HoloMe-debug.apk
```

No Gradle and no Google SDK: resources via `aapt`, compile via `javac` against a
hash-pinned API-23 framework jar, dex via `dx`, aligned and debug-signed. The build
refuses to run if the framework jar's sha256 changes.

## Install (sideload)

1. Copy `HoloMe-debug.apk` to the phone and open it (allow "install unknown apps").
2. First start: enter the platform URL (e.g. `https://beam.example.com`).
3. Grant camera + microphone when asked. Long-press BACK to change the platform later.

## Honest limits of this build

- **Debug-signed, sideload only.** A Play release needs the official SDK toolchain, the
  company keystore, a targetSdk review, and `usesCleartextTraffic` turned off (it is on
  here so LAN test platforms over plain http work).
- **Built, not run, in this environment** — first run happens on a real phone. WebRTC
  inside Android WebView needs an up-to-date Android System WebView.
- Native mobile apps are formally post-M8 scope (MILESTONES.md); this shell exists at
  the owner's request and deliberately adds no product logic of its own.
