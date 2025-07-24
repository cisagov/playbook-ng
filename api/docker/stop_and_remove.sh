#!/bin/bash
# Removes the P-NG as an API container

pushd $(dirname "$0") > /dev/null

echo "[compose] down"
sudo docker compose down --remove-orphans

echo "-*- finished -*-"

popd > /dev/null
