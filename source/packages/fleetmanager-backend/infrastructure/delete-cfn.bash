#!/bin/bash

set -e

#---------------------------------------------------------------------------------------------------------------------
#  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
#                                                                                                                    *
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
#  with the License. A copy of the License is located at                                                             *
#                                                                                                                    *
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
#                                                                                                                    *
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
#  and limitations under the License.                                                                                *
#---------------------------------------------------------------------------------------------------------------------

function help_message {
    cat << EOF

NAME

    delete.bash

DESCRIPTION

    Deletes all stacks related to the CMS backend only.

MANDATORY ARGUMENTS:

    -e (string)   Name of environment.

OPTIONAL ARGUMENTS:

    -R (string)   AWS region.
    -P (string)   AWS profile.

DEPENDENCIES REQUIRED:

    - aws-cli

EOF
}


##########################################################
######  parse and validate the provided arguments   ######
##########################################################
while getopts ":e:R:P:" opt; do
  case $opt in
    e  ) ENVIRONMENT=$OPTARG;;
    R  ) AWS_REGION=$OPTARG;;
    P  ) AWS_PROFILE=$OPTARG;;

    \? ) echo "Unknown option: -$OPTARG" >&2; help_message; exit 1;;
    :  ) echo "Missing option argument for -$OPTARG" >&2; help_message; exit 1;;
    *  ) echo "Unimplemented option: -$OPTARG" >&2; help_message; exit 1;;
  esac
done


if [ -z "$ENVIRONMENT" ]; then
    echo -e ENVIRONMENT is required; help_message; exit 1;
fi


if [ -z "$AWS_REGION" ]; then
    AWS_REGION=$(aws configure get region $AWS_ARGS)
fi

AWS_ARGS="--region $AWS_REGION "

if [ -n "$AWS_PROFILE" ]; then
    AWS_ARGS="$AWS_ARGS --profile $AWS_PROFILE"
fi

# list of stack names of the CDF Auto platform for deletion. Order matters!
StackArray=("cdf-auto-fleetmanager-${ENVIRONMENT}" \
"cdf-auto-fleetmanager-backend-ui-resources-${ENVIRONMENT}")

echo '
**********************************************************
*****               Stack Deletion                  ******
**********************************************************
'

for stack in ${StackArray[*]}; do
    echo $stack

    aws cloudformation delete-stack \
    --stack-name $stack \
    $AWS_ARGS

done


echo '
**********************************************************
*****                 Complete                      ******
**********************************************************
'
