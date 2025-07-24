#!/bin/bash
# Builds the API into dist/

pushd $(dirname "$0") > /dev/null

echo "[rm] clearing old dist/"
rm -rf dist/

echo "[tsc] compiling"
npx tsc

echo "[sed] adding .js to import paths"
find dist/ -type f -exec sed -i -E 's/from "(\.{1,2}\/[^"]+)";/from "\1.js";/g' {} \;

echo "-*- finished -*-"

popd > /dev/null
