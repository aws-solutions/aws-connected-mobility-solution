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
    deploy-cfn.bash    

DESCRIPTION
    Deploys the Data Generation (auto) service.

MANDATORY ARGUMENTS:
    -e (string)   Name of environment.
    -c (string)   Location of application configuration file containing configuration overrides.

OPTIONAL ARGUMENTS
    -S (string)   What to name this stack.  Defaults to cdf-simulation-datagen-auto-${ENVIRONMENT}.
    -R (string)   AWS region.
    -P (string)   AWS profile.
    
EOF
}

while getopts ":e:c:k:N:C:S:R:P:" opt; do
  case $opt in

    e  ) export ENVIRONMENT=$OPTARG;;
    c  ) export CONFIG_LOCATION=$OPTARG;;

    S  ) export STACK_NAME=$OPTARG;;

    R  ) export AWS_REGION=$OPTARG;;
    P  ) export AWS_PROFILE=$OPTARG;;

    \? ) echo "Unknown option: -$OPTARG" >&2; help_message; exit 1;;
    :  ) echo "Missing option argument for -$OPTARG" >&2; help_message; exit 1;;
    *  ) echo "Unimplemented option: -$OPTARG" >&2; help_message; exit 1;;
  esac
done


if [ -z "$ENVIRONMENT" ]; then
	echo -e ENVIRONMENT is required; help_message; exit 1;
fi

if [ -z "$CONFIG_LOCATION" ]; then
	echo -c CONFIG_LOCATION is required; help_message; exit 1;
fi


AWS_ARGS=
if [ -n "$AWS_REGION" ]; then
	AWS_ARGS="--region $AWS_REGION "
fi
if [ -n "$AWS_PROFILE" ]; then
	AWS_ARGS="$AWS_ARGS--profile $AWS_PROFILE"
fi

if [ -z "$STACK_NAME" ]; then
  STACK_NAME=cdf-simulation-datagen-auto-${ENVIRONMENT}
fi




echo "
Running with:
  ENVIRONMENT:                $ENVIRONMENT
  STACK_NAME:                 $STACK_NAME
  CONFIG_LOCATION:            $CONFIG_LOCATION
  AWS_REGION:                 $AWS_REGION
  AWS_PROFILE:                $AWS_PROFILE
"
cwd=$(dirname "$0")


echo '
**********************************************************
  Deploying the Data Generation (auto) CloudFormation template
**********************************************************
'
application_configuration_override=$(cat $CONFIG_LOCATION)

aws cloudformation deploy \
  --template-file $cwd/build/cfn-data-generator-auto-output.yml \
  --stack-name $STACK_NAME \
  --parameter-overrides \
      Environment=$ENVIRONMENT \
      ApplicationConfigurationOverride="$application_configuration_override" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  $AWS_ARGS


echo '
**********************************************************
  Done!
**********************************************************
'
