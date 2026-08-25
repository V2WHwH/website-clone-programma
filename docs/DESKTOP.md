# HereWeHolo Player — Windows-desktopapplicatie

Technische documentatie voor de desktopversie (map `desktop/`): architectuur,
build, performance en releaseproces.

## Architectuur

```
┌──────────────────────────────────────────────────────┐
│ HereWeHolo Player (Electron, Windows x64)             │
│                                                      │
│  main.js (hoofdproces)                                │
│   • kioskmodus, single-instance, sneltoetsen          │
│   • GPU-flags + hardwaredetectie → logs/hardware.json │
│   • structured JSONL-logging met rotatie (5×5 MB)     │
│   • crash-herstel (render-process-gone → reload)      │
│   • settings.json (atomic writes) in %APPDATA%        │
│   • diagnosticsvenster (Ctrl+Shift+D)                 │
│                                                      │
│  app/index.html (renderer)                            │
│   = de Studio-app uit studio/ (gesynchroniseerd bij   │
│     build door sync-app.js) — knoppen, video's,       │
│     zweefanimaties, IndexedDB-opslag                  │
└──────────────────────────────────────────────────────┘
```

### Stackkeuze (afweging conform masterprompt)

De player is **video-afspeelsoftware**, geen capture-software. De kern is een
bewezen webapp (Studio) en Chromium levert op Windows hardware-videodecodering
via D3D11/DXVA (NVDEC, Intel Quick Sync, AMD VCN) plus GPU-compositing
out-of-the-box. Een native C++/DirectX-herbouw zou voor dit afspeelscenario
geen meetbare winst opleveren en de onderhoudbaarheid schaden — daarom is hier
bewust voor een Electron-shell gekozen (het "aantoonbaar voordeel"-criterium).

### GPU-strategie

- Flags: `ignore-gpu-blocklist`, `enable-gpu-rasterization`, `enable-zero-copy`,
  `PlatformHEVCDecoderSupport` (HEVC-decode op hardware die dit kan).
- Decodering: Chromium kiest zelf hardware-decoders (NVDEC/QSV/VCN via D3D11)
  met automatische CPU-fallback — geen handmatige encoderkeuze nodig voor
  afspelen.
- CPU-fallback: instelling `hardwareAcceleration: false` (via het
  diagnosticsvenster) schakelt naar volledige software-rendering.
- Verificatie op doelhardware: diagnosticsvenster → "Video-decodering:
  hardware ✔".

## Build

Lokaal (op Windows met Node.js 22):

```powershell
cd desktop
npm install
npm run start      # ontwikkelmodus
npm run dist       # release: NSIS-installer + portable zip in desktop/release/
```

CI: `.github/workflows/desktop-build.yml` bouwt bij elke push aan
`desktop/**` of `studio/**` op `windows-latest`:

1. `npm run check` — syntaxcontrole
2. `electron-builder` — NSIS-installer + portable zip (x64, unsigned)
3. **Smoke-test op Windows**: de gebouwde exe start met `--smoke-test`,
   voert hardwaredetectie uit, schrijft `smoke-result.json` en sluit met
   exitcode 0
4. SHA-256-checksums → `SHA256SUMS.txt`
5. Artefacten als download-artifact; bij een `v*`-tag automatisch een
   GitHub Release

## Performance

- Doel: vloeiende 4K-weergave (2160×3840 en 3840×2160) op hardware met
  H.264/HEVC-hardware-decode; animaties zijn uitsluitend GPU-gecomposite
  transforms (geen layout/paint per frame).
- Aanbevolen content: mp4, H.264 High@L5.1 of H.265, 20–40 Mbps.
- Meting op doelhardware: diagnosticsvenster (GPU-featurestatus) en logs.

## Release

- Versienummers: semantic versioning; `desktop/package.json` is leidend en
  komt automatisch in exe-metadata, installer en artifactnamen.
- Release maken: tag pushen (`git tag v1.0.0 && git push origin v1.0.0`) →
  workflow bouwt en publiceert de GitHub Release met checksums.
- Code signing: voorbereid maar **unsigned** zolang er geen
  Authenticode-certificaat is (`CSC_IDENTITY_AUTO_DISCOVERY=false`);
  certificaat later toevoegen via electron-builder `CSC_LINK`/`CSC_KEY_PASSWORD`
  secrets — nooit sleutels in de repository.

## Productiestatus (eerlijk overzicht)

Geverifieerd in CI (echte Windows-machine, zonder dedicated GPU):

- [CI] Build slaagt, installer + portable zip worden geproduceerd
- [CI] Exe start, hardwaredetectie draait, nette afsluiting (smoke-test)
- [CI] Checksums gegenereerd

Lokaal geverifieerd (Linux-ontwikkelomgeving):

- [OK] Renderer (Studio-app) volledig getest via Playwright/Chromium —
  zie eerdere testresultaten in de repo-historie
- [OK] Syntaxcontrole hoofdproces/preload

**UNVERIFIED ON TARGET HARDWARE** (vereist een echte Windows-pc met GPU):

- Hardware-videodecode actief (NVDEC/QSV/VCN) — controleer via diagnostiek
- 4K60-weergave vloeiend op doelhardware
- Kioskgedrag op de fysieke holobox (multi-monitor, DPI, portrait-paneel)
- Installer-gedrag op een schone machine buiten CI (Defender/SmartScreen;
  unsigned build geeft een SmartScreen-melding tot er gesigned wordt)
- Langdurige soak-test (24 uur) op doelhardware
