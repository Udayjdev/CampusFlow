#!/usr/bin/env sh
# macOS / Linux: ./start.sh
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo "Install Node.js 22.13+ from https://nodejs.org"; exit 1; }
exec node setup.mjs "$@"
