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

python3 -m pip install --upgrade pip

python3 -m pip --disable-pip-version-check install --upgrade requests

python3 -m pip --disable-pip-version-check install -r requirements.txt

## bundle fleetmanager backend
#cd $root_dir/packages/fleetmanager-backend
rm -rf build dist tsconfig.tsbuildinfo
#./bundle.sh
