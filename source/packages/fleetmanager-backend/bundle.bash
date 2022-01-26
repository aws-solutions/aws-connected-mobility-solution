#!/bin/bash

set -e
if [[ "$DEBUG" == "true" ]]; then
    set -x
fi

function help_message {
    cat << EOF

NAME

    bundle.bash

DESCRIPTION

    Bundles the CMS services ready for deployment.

DEPENDENCIES REQUIRED:
    pnpm
    jq
    chalice
    python
    pip3
EOF
}

cwd=$(dirname "$0")
root_dir=$(pwd)

cd $cwd
##pnpm run bundle

## bundle cdf-auto-fleetmanager-ui
## **Note: bundled separately to "avoid too many open files error"
#cd $root_dir/../../packages/fleetmanager-ui
#pnpm run bundle

## bundle cdf-auto-fleetmanager-ui-helper
## **Note: bundled separately to accommodate for module within a module
#cd $root_dir/../../packages/fleetmanager-ui/infrastructure/helper
#pnpm run bundle

## bundle fleetmanager backend
cd $root_dir

pip3 --disable-pip-version-check install --upgrade requests

pip3 --disable-pip-version-check install -r requirements.txt

## bundle fleetmanager backend
#cd $root_dir/packages/fleetmanager-backend
rm -rf build dist tsconfig.tsbuildinfo
./bundle.sh
