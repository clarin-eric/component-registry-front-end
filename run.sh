#!/usr/bin/env bash

# NOTE: check and configure .env before running!

if ! [ "${SRC_DIR}" ]; then
  SRC_DIR="$( cd "${SCRIPT_DIR}" || exit 1 ; pwd -P )"
fi

if ! [ -d "${SRC_DIR}" ]; then
	echo "Source directory ${SRC_DIR} not found"
	exit 1
fi

if [ -d "${SRC_DIR/node_modules}" ]; then
    echo "Node modules directory found; skipping install. Remove 'node_modules' to force an npm install"
else
    echo "Node modules directory not found; running npm install before starting"
    (cd "${SRC_DIR}" && docker-compose run --rm ui npm install)
fi

echo 'Starting project'
(
    cd "${SRC_DIR}" \
        && docker-compose up \
        && docker-compose down
)
