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

OPTIONAL ARGUMENTS
    -s     Base source directory of code for rush bundle

DEPENDENCIES REQUIRED:
    pnpm
    jq
    chalice
    python
    pip3
EOF
}

while getopts ":s" opt; do
  case $opt in

    s  ) export SOURCE_DIR=$OPTARG;;

    \? ) echo "Unknown option: -$OPTARG" >&2; help_message; exit 1;;
    :  ) echo "Missing option argument for -$OPTARG" >&2; help_message; exit 1;;
    *  ) echo "Unimplemented option: -$OPTARG" >&2; help_message; exit 1;;
  esac
done

cwd=$(dirname "$0")
if [ -z "$SOURCE_DIR" ]; then
    root_dir=$SOURCE_DIR
else
    root_dir=$(pwd)
fi
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
