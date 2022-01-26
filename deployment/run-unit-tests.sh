#!/bin/bash
#
# This assumes all of the OS-level configuration has been completed and git repo has already been cloned
#
# This script should be run from the repo's deployment directory
# cd deployment
# ./run-unit-tests.sh
#

# Get reference for all important folders
template_dir="$PWD"
source_dir="$template_dir/../source"

# note:  pnpm@3.5.7 has broken tsc
echo installing pnpm
npm i -g pnpm@3.5.3

echo installing jq...
curl -s -qL -o /usr/bin/jq https://stedolan.github.io/jq/download/linux64/jq
chmod +x /usr/bin/jq

echo installing yq
curl -s -qL -o /usr/bin/yq https://github.com/mikefarah/yq/releases/download/3.4.0/yq_linux_amd64
chmod +x /usr/bin/yq

echo installing chalice
pip3 install chalice

pnpm --version
pip3 --version
aws --version
yq --version
jq --version
docker --version

## bundle fleetmanager backend
cd $source_dir/packages/fleetmanager-backend
pip3 install -r requirements.txt
