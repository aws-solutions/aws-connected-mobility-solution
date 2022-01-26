#!/bin/bash
#-----------------------------------------------------------------------------------------------------------------------
#   Copyright Amazon.com Inc. or its affiliates. All Rights Reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
#  with the License. A copy of the License is located at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
#  and limitations under the License.
#-----------------------------------------------------------------------------------------------------------------------


set -e
if [[ "$DEBUG" == "true" ]]; then
    set -x
fi

function help_message {
    cat << EOF
NAME
    bundle-core.bash    
DESCRIPTION
    Bundles the CMS core services as well as any dependant lambda layers, ready for deployment.
OPTIONAL ARGUMENTS
    -r (flag)     Prepare Bundle for Release
    
EOF
}

while getopts ":r:z" opt; do
  case $opt in

    r  ) export RELEASE_PREP=true;;

    \? ) echo "Unknown option: -$OPTARG" >&2; help_message; exit 1;;
    :  ) echo "Missing option argument for -$OPTARG" >&2; help_message; exit 1;;
    *  ) echo "Unimplemented option: -$OPTARG" >&2; help_message; exit 1;;
  esac
done

cwd=$(dirname "$0")
root_dir=$(pwd)

cd $root_dir
rush purge                      # delete all rush temp files

npm install -g typescript

npm install -g shx

echo "Completed rush purge"

rush update --full                    # as temp files deleted, need to refresh dependencies

echo "Completed rush update"

rush build --verbose                     # compile

echo "Completed rush build"
# create the deployment packages
rm -rf deploy
mkdir deploy

echo "Completing run bundle"
npx pnpm@6.4.0 recursive run bundle  # pinning to an older version here as latest pnpm (6.20.1) has broken `enable-pre-post-scripts=true`

if [ "$RELEASE_PREP" = "true" ]; then
  rush clean:postrelease            # deep clean of complied files, excluding any bundles
  rush purge                    # delete all rush temp files
fi

echo "Completed CMS build."