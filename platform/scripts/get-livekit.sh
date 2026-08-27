#!/usr/bin/env bash
# Fetch the LiveKit server binary (ADR-001) into platform/.livekit/ for local dev and e2e tests.
set -euo pipefail
VERSION="${LIVEKIT_VERSION:-1.9.1}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/.livekit"
BIN="$DIR/livekit-server"
if [ -x "$BIN" ]; then
  echo "already present: $("$BIN" --version)"
  exit 0
fi
mkdir -p "$DIR"
URL="https://github.com/livekit/livekit/releases/download/v${VERSION}/livekit_${VERSION}_linux_amd64.tar.gz"
echo "downloading $URL"
curl -sSL "$URL" | tar xz -C "$DIR" livekit-server
"$BIN" --version
