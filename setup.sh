#!/bin/bash
# One-time setup on the Mac: installs the renderer's dependencies and checks that Chromium uses the GPU.
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then
  echo "Node.js is missing. Install the LTS version from https://nodejs.org (or: brew install node), then run ./setup.sh again."
  exit 1
fi
npm install --no-audit --no-fund
npx playwright-core install chromium
mkdir -p results logs v2/out jobs
node gpucheck.mjs
echo
echo "Test render (3 frames):"
( cd v2 && time node r2.mjs X10-de --preview=2,10,20 )
echo
echo "Setup done. Start the worker with:   caffeinate -i ./worker.sh"
