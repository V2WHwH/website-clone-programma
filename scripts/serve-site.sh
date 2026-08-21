#!/usr/bin/env bash
#
# Serveer de gedownloade kopie lokaal, zodat je hem in de browser kunt bekijken.
#
#   ./scripts/serve-site.sh [OUT_DIR] [POORT]
#
set -euo pipefail

OUT_DIR="${1:-site}"
PORT="${2:-8000}"

[[ -d "$OUT_DIR" ]] || { echo "FOUT: '$OUT_DIR' bestaat niet — draai eerst ./scripts/download-site.sh" >&2; exit 1; }

# Pak de host-map als die er is, zodat je direct op de homepage uitkomt in
# plaats van op een directory-listing.
root="$OUT_DIR"
entry=""
for d in "$OUT_DIR"/*/; do
  if [[ -f "${d}index.html" ]]; then
    entry="$(basename "$d")/index.html"
    break
  fi
done

echo "Serveren vanuit ./$root op http://localhost:$PORT/${entry}"
echo "Stoppen met Ctrl-C."
exec python3 -m http.server "$PORT" --directory "$root"
