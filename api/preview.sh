#!/bin/bash
# Runs the API dist/ build

pushd $(dirname "$0") > /dev/null

echo "[node] running dist/api/src/index.js"
node dist/api/src/index.js

popd > /dev/null
