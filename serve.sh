#!/usr/bin/env bash
# serve.sh — Launch a local dev server for the portfolio
# Usage:  bash serve.sh

PORT=8000
URL="http://localhost:$PORT"

echo "🚀  Starting server on $URL"

# Open in the default browser (cross-platform)
if command -v xdg-open &>/dev/null; then
  xdg-open "$URL" &
elif command -v open &>/dev/null; then
  open "$URL" &
elif command -v start &>/dev/null; then
  start "$URL" &
fi

py -m http.server "$PORT"
