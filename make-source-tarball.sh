#!/bin/bash
VERSION="$1"
if [ "${VERSION}" ]; then
	OUT_FILE="${VERSION}.tar.gz"
	if [ -e "${OUT_FILE}" ]; then
		echo "Removing existing ${OUT_FILE}" >&2
		rm "${OUT_FILE}"
	fi
	tar zcvf "${VERSION}.tar.gz"  --exclude node_modules --exclude dist --exclude target --exclude .git --exclude "${OUT_FILE}" . >&2
	echo "Done" >&2
	echo "${OUT_FILE}"
else
	echo "Specify version number"
	exit 1
fi

