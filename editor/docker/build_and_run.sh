#!/bin/bash
# Builds the Countermeasure Editor in a node container, and hosts in an nginx container

pushd $(dirname "$0") > /dev/null

echo "[docker] build image"
sudo docker build ../.. -f ../../editor.Dockerfile -t countermeasure-editor-nginx

echo "[compose] up"
sudo docker compose up -d

echo "-*- finished -*-"

popd > /dev/null
