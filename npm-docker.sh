#!/bin/bash

#####################################################################################
# Script for building the Component Registry without depending on a local node enviroment.
# Requires docker to be installed and available to the current user!
#####################################################################################
#configuration
APP_NAME="component-registry-frontend"
BUILD_IMAGE="registry.gitlab.com/clarin-eric/docker-alpine-clrs-build_env:2.1.0"
CLEAN_CACHE=${CLEAN_CACHE:-false}

SCRIPT_DIR="$( cd "$(dirname "$0")" || exit 1; pwd -P )"
BUILD_CACHE_VOLUME="${APP_NAME}-node-build-cache"
BUILD_CONTAINER_NAME="${APP_NAME}-npm-build"

BUILD_CMD=("npm")
BUILD_CMD+=("$@")

if ! [ "${SRC_DIR}" ]; then
  SRC_DIR="$( cd "${SCRIPT_DIR}" || exit 1 ; pwd -P )"
fi

if ! [ -d "${SRC_DIR}" ]; then
	echo "Source directory ${SRC_DIR} not found"
	exit 1
fi

#### MAIN FUNCTIONS

main() {
	check_docker
	pull_image
	prepare_cache_volume

	echo "Source dir: ${SRC_DIR}"
	echo "Build commands:" "${BUILD_CMD[@]}"
	echo "Build image: ${BUILD_IMAGE}"

	docker_run
}

#### HELPER FUNCTIONS

check_docker() {
	if ! which docker > /dev/null; then
		echo "Docker command not found"
		exit 1
	fi
}

pull_image() {
	if ! docker pull "${BUILD_IMAGE}"; then
		echo "Failed to pull image ${BUILD_IMAGE} for build"
		exit 1
	fi
}

prepare_cache_volume() {
	if docker volume ls -f "name=${BUILD_CACHE_VOLUME}"|grep "${BUILD_CACHE_VOLUME}"; then
		if ${CLEAN_CACHE}; then
			echo "Removing cache volume ${BUILD_CACHE_VOLUME}"
			docker volume rm "${BUILD_CACHE_VOLUME}"
		else
			echo "Using existing cache volume ${BUILD_CACHE_VOLUME}"
		fi
	else
		echo "Creating cache volume ${BUILD_CACHE_VOLUME}"
		docker volume create "${BUILD_CACHE_VOLUME}"
	fi
}

docker_run() {
	docker run \
		--rm \
		--name "${BUILD_CONTAINER_NAME}" \
		-v "${SRC_DIR}":/var/src  \
		-w /var/src \
		-p 3000:3000 \
		"${BUILD_IMAGE}" "${BUILD_CMD[@]}"
}

# Execute main
main
