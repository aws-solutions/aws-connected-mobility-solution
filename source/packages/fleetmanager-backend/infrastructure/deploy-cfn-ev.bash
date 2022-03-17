#!/bin/bash
set -e

#-------------------------------------------------------------------------------------------
# Copyright (c) 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.
#-------------------------------------------------------------------------------------------

function help_message {
    cat << EOF

NAME
    deploy-cfn.bash

DESCRIPTION
    Deploys the CDF Auto Back-End service.

MANDATORY ARGUMENTS:

    -a (string)   CDF Asset Library URL.
    -b (string)   The name of the S3 bucket to deploy CloudFormation templates into.
    -c (string)   CDF Commands URL.
    -n (string)   DDB Table Anomaly Stream Arn.
    -e (string)   Environmental var
    -p (string)   Cognito User Pool Admin Email

OPTIONAL ARGUMENTS
    -S (string)   What to name this stack.  Defaults to cdf-auto-fleetmanager.
    -B (string)   Bypass Bundling dependencies

    -R (string)   AWS region.
    -P (string)   AWS profile.

EOF
}

while getopts ":S:b:R:P:Ba:c:n:e:p:" opt; do
  case $opt in

    S  ) STACK_NAME=$OPTARG;;
    b  ) BUCKET_NAME=$OPTARG;;

    R  ) AWS_REGION=$OPTARG;;
    P  ) AWS_PROFILE=$OPTARG;;
    B  ) BYPASS_BUNDLE=true;;

    a  ) CDF_ASSET_LIBRARY_URL=$OPTARG;;
    c  ) CDF_COMMANDS_URL=$OPTARG;;
    n  ) DDB_TABLE_STREAM_ARN=$OPTARG;;
    e  ) ENV_VAR=$OPTARG;;
    p  ) USER_POOL_ADMIN_EMAIL=$OPTARG;;

    \? ) echo "Unknown option: -$OPTARG" >&2; help_message; exit 1;;
    :  ) echo "Missing option argument for -$OPTARG" >&2; help_message; exit 1;;
    *  ) echo "Unimplemented option: -$OPTARG" >&2; help_message; exit 1;;
  esac
done

# required params
if [ -z "$CDF_ASSET_LIBRARY_URL" ]; then
	echo -a CDF_ASSET_LIBRARY_URL is required; help_message; exit 1;
fi

if [ -z "$BUCKET_NAME" ]; then
	echo -b BUCKET_NAME is required; help_message; exit 1;
fi

if [ -z "$CDF_COMMANDS_URL" ]; then
	echo -c CDF_COMMANDS_URL is required; help_message; exit 1;
fi

if [ -z "$DDB_TABLE_STREAM_ARN" ]; then
	echo -n DDB_TABLE_STREAM_ARN is required; help_message; exit 1;
fi

if [ -z "$ENV_VAR" ]; then
	echo -e ENV_VAR is required; help_message; exit 1;
fi

if [ -z "$USER_POOL_ADMIN_EMAIL" ]; then
	echo -p USER_POOL_ADMIN_EMAIL is required; help_message; exit 1;
fi


# default stack name
if [ -z "$STACK_NAME" ]; then
  STACK_NAME=cdf-auto-fleetmanager-"$ENV_VAR"
fi

# set AWS ARGS
AWS_ARGS=
if [ -z "$AWS_REGION" ]; then
    AWS_REGION=$(aws configure get region $AWS_ARGS)
fi

AWS_ARGS="--region $AWS_REGION "
AWS_SCRIPT_ARGS="-R $AWS_REGION "

if [ -n "$AWS_PROFILE" ]; then
    AWS_ARGS="$AWS_ARGS--profile $AWS_PROFILE"
    AWS_SCRIPT_ARGS="$AWS_SCRIPT_ARGS -P $AWS_PROFILE"
fi

echo "
Running with:
  STACK_NAME:             $STACK_NAME
  BUCKET_NAME:            $BUCKET_NAME
  AWS_REGION:             $AWS_REGION
  AWS_PROFILE:            $AWS_PROFILE
  ENV_VAR                 $ENV_VAR
  CDF_ASSET_LIBRARY_URL:  $CDF_ASSET_LIBRARY_URL
  CDF_COMMANDS_URL:       $CDF_COMMANDS_URL
  USER_POOL_ADMIN_EMAIL:  $USER_POOL_ADMIN_EMAIL
  DDB_TABLE_STREAM_ARN:   $DDB_TABLE_STREAM_ARN
  BYPASS_BUNDLE:          $BYPASS_BUNDLE
"

NON_CHALICE_STACK_NAME="cdf-auto-fleetmanager-backend-ui-resources-"$ENV_VAR

echo '
**********************************************************
  Processing...
**********************************************************
'

if [ -z "$BYPASS_BUNDLE" ]; then
    echo '
    PACKAGING AND DEPLOYMENT...

    **********************************************************
      Bundling Dependencies...
    **********************************************************
    '
    cd ..
    ./bundle.sh

fi

echo '
***************************************************************************
  Cloudformation Packaging -> Fleetmanager UI Resources
***************************************************************************
'
aws cloudformation package \
  --template-file infrastructure/cdf-auto-fleetmanager-ui-resources.json \
  --s3-bucket $BUCKET_NAME \
  $AWS_ARGS \
  --output-template-file infrastructure/build/cdf-auto-fleetmanager-ui-resources-output.yaml

echo '
*****************************************************************************
  Cloudformation Deploying -> Fleetmanager UI Resources
*****************************************************************************
'
aws cloudformation deploy \
  --template-file infrastructure/build/cdf-auto-fleetmanager-ui-resources-output.yaml \
  --s3-bucket $BUCKET_NAME \
  --stack-name $NON_CHALICE_STACK_NAME \
  --parameter-overrides \
      AdministratorEmail="$USER_POOL_ADMIN_EMAIL" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  $AWS_ARGS

echo '
***********************************************************************
  Cloudformation Packaging -> Fleetmanager Backend
***********************************************************************
'
aws cloudformation package \
  $AWS_ARGS \
  --template-file infrastructure/build/cdf-auto-fleetmanager-backend/sam.json \
  --s3-bucket $BUCKET_NAME \
  --output-template-file infrastructure/build/cdf-auto-fleetmanager-output.yaml

echo '
**********************************************************
  Cloudformation Deploy -> Fleetmanager Backend
**********************************************************
'
aws cloudformation deploy \
  $AWS_ARGS \
  --template-file infrastructure/build/cdf-auto-fleetmanager-output.yaml \
  --s3-bucket $BUCKET_NAME \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    VehicleAnomalyTableStreamArn="$DDB_TABLE_STREAM_ARN" \
    CDFCommandsUrl="$CDF_COMMANDS_URL" \
    CDFAssetLibraryUrl="$CDF_ASSET_LIBRARY_URL" \
    EnvironmentName="$ENV_VAR" \
    CDFAutoUIResourcesStack="$NON_CHALICE_STACK_NAME" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset

echo '
**********************************************************
  Completed
**********************************************************
'
