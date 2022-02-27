#!/bin/sh

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

## bundle fleetmanager backend
cd $root_dir

export PIP_DISABLE_PIP_VERSION_CHECK=1

sudo python -m pip --disable-pip-version-check install pip==21.0.1

sudo python -m pip --disable-pip-version-check install --upgrade requests 2> /dev/null

sudo python -m pip --disable-pip-version-check install -r requirements.txt 2> /dev/null

sudo python -m pip --disable-pip-version-check install chalice 2> /dev/null

## bundle fleetmanager backend
#cd $root_dir/packages/fleetmanager-backend
rm -rf build dist tsconfig.tsbuildinfo
./bundle.sh 2> /dev/null
