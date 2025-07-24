#!/bin/bash
# Builds Playbook-NG Export Metrics in a Golang container, then hosts in a bare container

pushd $(dirname "$0") > /dev/null

echo "[docker] build image"
sudo docker build ../.. -f ../../metrics.Dockerfile -t playbook-ng-export-metrics-golang

echo "[compose] up"
sudo docker compose up -d

echo "-*- finished -*-"

popd > /dev/null
