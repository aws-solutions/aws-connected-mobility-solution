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

## bundle fleetmanager backend
#cd $root_dir

export PIP_DISABLE_PIP_VERSION_CHECK=1
export PIP_NO_CACHE_DIR=1

pip3 install --user --no-warn-script-location  --no-cache-dir --disable-pip-version-check -r requirements.txt 2>/dev/null

pip3 install --user --no-warn-script-location --no-cache-dir --disable-pip-version-check chalice 2>/dev/null

## bundle fleetmanager backend
rm -rf build dist tsconfig.tsbuildinfo

config_dir=$(pwd)
root_dir=$(dirname "$0")

mkdir $config_dir/build

FOLDERDIR="$config_dir/src"
VALIDATORDIR="$FILEDIR/validators"
DESTDIR="$config_dir/build"

echo '
**********************************************************
*******   CMS Fleetmanager: Packaging Lambdas     ********
**********************************************************
'
# create python depenedencies for lambda layer, zip up and send to build directory
cd src/lambda_layer
pip3 install --target=python --no-warn-script-location  --no-cache-dir --disable-pip-version-check -r requirements.txt 
zip -r "python.zip" python
mv python.zip "$DESTDIR"
cd ../..

# run through all files and zip them up with their dependencies.
# The zipped directory is where the Cloudformation template references zipped files per lambda
if [ $# -eq 0 ]; then
    for folder in ${FOLDERDIR}/*;
    do
        basename=$(basename $folder)

        if [ $basename != "lambda_layer" ]
        then
            echo 'Folder path: ' $folder
            echo 'Base name: ' $basename
            
            sudo zip -r -j "$basename.zip" "$folder"
            sudo mv "$basename.zip" "$DESTDIR"
            echo "complete"
        fi
    done
fi

echo '
**********************************************************
*******  CMS Fleetmanager: Packaging CF Template  ********
**********************************************************
'
chalice package --merge-template ./infrastructure/cfn-cms-fleetmanager-backend-resources.json ./infrastructure/build 
