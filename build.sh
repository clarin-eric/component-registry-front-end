#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$(dirname "$0")" || exit 1 ; pwd -P )"

INSTALL=0
BUILD=0
#START=1

#
# Process script arguments and parse all optional flags
#
while [[ $# -gt 0 ]]
do
key="$1"
case $key in
    'install')
        INSTALL=1
        ;;
    'build')
        BUILD=1
        ;;
esac
shift # past argument or value
done

if [ "${INSTALL}" = 1 ]; then
    (cd "$SCRIPT_DIR" && docker compose run --rm --quiet-pull ui npm install)
fi

if [ "${BUILD}" = 1 ]; then
    (cd "$SCRIPT_DIR" && docker compose run --rm --quiet-pull ui npm run build)
fi
