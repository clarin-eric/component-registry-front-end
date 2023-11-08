#!/bin/bash

SCRIPT_DIR="$( cd "$(dirname "$0")" ; pwd -P )"

bash "${SCRIPT_DIR}/npm-docker.sh" start

# Add to network so that REST back end can be proxied
