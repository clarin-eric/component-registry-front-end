#!/bin/bash

SCRIPT_DIR="$( cd "$(dirname "$0")" ; pwd -P )"

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

[ "${INSTALL}" = 1 ] && bash "${SCRIPT_DIR}/npm-docker.sh" install
[ "${BUILD}" = 1 ] && bash "${SCRIPT_DIR}/npm-docker.sh" run build


