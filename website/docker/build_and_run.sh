#!/bin/bash
# Builds the Playbook-NG Website in a node container, and hosts in an nginx container

pushd $(dirname "$0") > /dev/null

echo "[docker] build image"
sudo docker build ../.. -f ../../website.Dockerfile -t playbook-ng-website-nginx

echo "[compose] up"
sudo docker compose up -d

echo "-*- finished -*-"

popd > /dev/null
