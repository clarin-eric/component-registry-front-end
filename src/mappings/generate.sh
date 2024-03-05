#!/bin/sh
#
# This script will generate a Component.js file based on the component schema
# from the CMDI toolkit.
#
# For more information about the creation of a mapping file based on an XML
# Schema, see <https://github.com/highsource/jsonix>.


# Set the following variable to the project directory's root and run the script
PROJECT_DIR="../.." #or an absolute path such as ~/git/component-registry-front-end

# Locations within project
JSONIX_JAR_PATH='node_modules/jsonix/lib/jsonix-schema-compiler-full.jar'
COMPONENT_SCHEMA_PATH='src/mappings/cmd-component.xsd'
BINDINGS_PATH='src/mappings/bindings.xjb'
MAPPING_OUTPUT_DIR='src/mappings'

cd "${PROJECT_DIR}" || { echo "ERROR: project directory does not exist"; exit 1; }

echo Generating mapping file...

set -x; java \
 -jar "${JSONIX_JAR_PATH}" \
 -d "${MAPPING_OUTPUT_DIR}" \
 -p Component "${COMPONENT_SCHEMA_PATH}" \
 -b "${BINDINGS_PATH}"

cd - > /dev/null || exit 0
