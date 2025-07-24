#!/bin/bash
# Builds and hosts P-NG as an API in a node container

pushd $(dirname "$0") > /dev/null

echo "[docker] build image"
sudo docker build ../.. -f ../../api.Dockerfile -t playbook-ng-api-node

echo "[compose] up"
sudo docker compose up -d

echo "-*- finished -*-"

popd > /dev/null
