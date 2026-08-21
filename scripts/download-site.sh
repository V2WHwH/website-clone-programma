#!/usr/bin/env bash
#
# Mirror een (Webflow-)website naar een lokale, offline-bruikbare kopie.
#
#   ./scripts/download-site.sh [BASE_URL] [OUT_DIR]
#
# Standaard: https://hereweholo.webflow.io/ -> ./site
#
set -euo pipefail

BASE_URL="${1:-https://hereweholo.webflow.io/}"
OUT_DIR="${2:-site}"

# Normaliseer: zorg voor een afsluitende slash en haal de host eruit.
[[ "$BASE_URL" == */ ]] || BASE_URL="${BASE_URL}/"
HOST="$(printf '%s' "$BASE_URL" | sed -E 's#^https?://##; s#/.*$##')"

# Webflow serveert pagina's vanaf de site-host en de assets (afbeeldingen, CSS,
# JS, fonts) vanaf een aantal CDN-hosts. Zonder deze hosts in de allowlist krijg
# je wel de HTML maar geen styling of beeld.
ASSET_DOMAINS=(
  "$HOST"
  cdn.prod.website-files.com
  assets.website-files.com
  assets-global.website-files.com
  uploads-ssl.webflow.com
  d3e54v103j8qbb.cloudfront.net
  fonts.googleapis.com
  fonts.gstatic.com
)
DOMAINS="$(IFS=,; echo "${ASSET_DOMAINS[*]}")"

UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mFOUT:\033[0m %s\n' "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Preflight: is de host überhaupt bereikbaar vanuit deze omgeving?
# ---------------------------------------------------------------------------
log "Bereikbaarheid controleren: $BASE_URL"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$BASE_URL" || true)"

if [[ "$code" == "000" ]]; then
  echo >&2
  echo "De host '$HOST' is niet bereikbaar vanuit deze omgeving." >&2
  echo >&2
  if [[ -n "${HTTPS_PROXY:-}" ]]; then
    echo "Er staat een agent-proxy actief (HTTPS_PROXY=$HTTPS_PROXY)." >&2
    echo "Laatste proxy-fouten:" >&2
    curl -sS "$HTTPS_PROXY/__agentproxy/status" 2>/dev/null \
      | python3 -c 'import sys,json;[print("  ",f["host"],"-",f["detail"]) for f in json.load(sys.stdin).get("recentRelayFailures",[])]' \
      2>/dev/null || echo "  (status-endpoint niet leesbaar)" >&2
    echo >&2
    echo "Een 403 op de CONNECT betekent dat de egress-policy van de sessie deze" >&2
    echo "host blokkeert. Draai dit script lokaal, of sta de host toe in het" >&2
    echo "netwerkbeleid van de omgeving." >&2
  fi
  exit 1
fi
log "HTTP $code — host reageert."

mkdir -p "$OUT_DIR"

# ---------------------------------------------------------------------------
# 2. Sitemap uitlezen als seed-lijst.
#
# Alleen recursief crawlen mist pagina's die nergens vandaan gelinkt worden.
# De sitemap vult die gaten. Ontbreekt hij, dan crawlen we gewoon vanaf de root.
# ---------------------------------------------------------------------------
SEEDS="$(mktemp)"
trap 'rm -f "$SEEDS"' EXIT
printf '%s\n' "$BASE_URL" > "$SEEDS"

log "Sitemap ophalen: ${BASE_URL}sitemap.xml"
if curl -sf --max-time 20 -A "$UA" "${BASE_URL}sitemap.xml" -o "$OUT_DIR/sitemap.xml"; then
  grep -oE '<loc>[^<]+</loc>' "$OUT_DIR/sitemap.xml" \
    | sed -E 's#</?loc>##g' >> "$SEEDS" || true
  log "Sitemap gevonden: $(($(wc -l < "$SEEDS") - 1)) URL's."
else
  log "Geen sitemap.xml — er wordt alleen vanaf de root gecrawld."
fi
sort -u -o "$SEEDS" "$SEEDS"

# ---------------------------------------------------------------------------
# 3. Mirror.
#
# -e robots=off: *.webflow.io serveert een robots.txt die alles dichtzet
#   (staging-domeinen horen niet geïndexeerd te worden). Voor het archiveren van
#   je eigen site is dat geen crawl-beleid maar een blokkade van de verkeerde
#   soort. Gebruik dit script niet op sites die niet van jou zijn.
# --adjust-extension: /over -> over.html, zodat het offline te openen is.
# --convert-links: links herschrijven naar de lokale kopie.
# Host-mappen blijven staan (geen --no-host-directories): bij --span-hosts
#   zouden CDN-paden anders botsen met paden van de site zelf. Resultaat:
#   site/<host>/... per host, met werkende relatieve links ertussen.
# ---------------------------------------------------------------------------
log "Mirror starten naar ./$OUT_DIR (dit kan een paar minuten duren)"
set +e
wget \
  --input-file="$SEEDS" \
  --recursive --level=inf \
  --page-requisites \
  --adjust-extension \
  --convert-links \
  --span-hosts --domains="$DOMAINS" \
  --directory-prefix="$OUT_DIR" \
  --execute robots=off \
  --user-agent="$UA" \
  --tries=5 --waitretry=3 --timeout=30 --retry-connrefused \
  --no-verbose \
  --append-output="$OUT_DIR/wget.log"
status=$?
set -e

# wget geeft 8 terug bij losse 404's op assets. Dat is geen reden om de hele
# mirror af te keuren; alleen een harde fout (geen enkele pagina) is dat wel.
if [[ $status -ne 0 && $status -ne 8 ]]; then
  die "wget stopte met exitcode $status — zie $OUT_DIR/wget.log"
fi

# ---------------------------------------------------------------------------
# 4. Rapport.
# ---------------------------------------------------------------------------
pages=$(find "$OUT_DIR" -name '*.html' | wc -l)
files=$(find "$OUT_DIR" -type f | wc -l)
size=$(du -sh "$OUT_DIR" | cut -f1)

echo
log "Klaar."
printf '    HTML-pagina%s : %s\n' "$([[ $pages -eq 1 ]] || echo "'s")" "$pages"
printf '    bestanden     : %s\n' "$files"
printf '    totale omvang : %s\n' "$size"
echo
if [[ $pages -eq 0 ]]; then
  die "Geen enkele pagina opgehaald — controleer $OUT_DIR/wget.log"
fi
log "Instappunt   : $OUT_DIR/$HOST/index.html"
log "Lokaal bekijken: ./scripts/serve-site.sh $OUT_DIR"
