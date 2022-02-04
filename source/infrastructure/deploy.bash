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

if [[ "$DEBUG" == "true" ]]; then
    set -x
fi

function help_message {
    cat << EOF

NAME

    deploy.bash

DESCRIPTION

    Deploys the CMS services.

MANDATORY ARGUMENTS:

    -e (string)   Name of environment.
    -b (string)   The name of the S3 bucket to deploy CloudFormation templates and configuration into.
    -l (string)   The name of CDF Core stack environment (development, test, stage, etc)
    -h (string)   The email of the Admin Owner


OPTIONAL ARGUMENTS

    COMMON OPTIONS::
    ----------------
    -E (string)   Name of configuration environment.  If not provided, then '-e ENVIRONMENT' is used.
    -k (string)   The KMS Key id that the provisioning service will use to decrypt sensitive information.  If not provided, a new KMS key with the alias 'cdf' is created.
    -K (string)   If an existing KMS key id not provided (-k), then instead one will be created. The username of an AWS user within the account is required for ownership.


    COMPILING OPTIONS:
    ------------------
    -B (flag)     Bypass bundling each module.  If deploying from a prebuilt tarfile rather than source code, setting this flag will speed up the deploy.
    -Y (flag)     Proceed with install bypassing the prompt requesting permission continue.

    AWS OPTIONS:
    ------------
    -R (string)   AWS region.
    -P (string)   AWS profile.

DEPENDENCIES REQUIRED:

    - aws-cli
    - jq
    - zip
    - git
    - pnpm

EOF
}


#-------------------------------------------------------------------------------
# Validate all COMMON arguments.  Any SERVICE specific arguments are validated
# by the service specific deployment script.
#-------------------------------------------------------------------------------

while getopts ":e:E:K:k:b:l:h:BYR:P:" opt; do
  case $opt in
    e  ) ENVIRONMENT=$OPTARG;;
    E  ) CONFIG_ENVIRONMENT=$OPTARG;;

    k  ) KMS_KEY_ID=$OPTARG;;
    K  ) KMS_KEY_OWNER=$OPTARG;;
    b  ) ARTIFACTS_BUCKET=$OPTARG;;
    l  ) CDF_CORE_ENVIRONMENT=$OPTARG;;
    h  ) ADMIN_EMAIL=$OPTARG;;

    B  ) BYPASS_BUNDLE=true;;
    Y  ) BYPASS_PROMPT=true;;

    R  ) AWS_REGION=$OPTARG;;
    P  ) AWS_PROFILE=$OPTARG;;

    \? ) echo "Unknown option: -$OPTARG" >&2; help_message; exit 1;;
    :  ) echo "Missing option argument for -$OPTARG" >&2; help_message; exit 1;;
    *  ) echo "Unimplemented option: -$OPTARG" >&2; help_message; exit 1;;
  esac
done

cwd=$(dirname "$0")
root_dir=$(pwd)

mkdir -p $cwd/build

source $cwd/common-deploy-functions.bash

incorrect_args=0

incorrect_args=$((incorrect_args+$(verifyMandatoryArgument ENVIRONMENT e $ENVIRONMENT)))
CONFIG_ENVIRONMENT="$(defaultIfNotSet 'CONFIG_ENVIRONMENT' E ${CONFIG_ENVIRONMENT} ${ENVIRONMENT})"

incorrect_args=$((incorrect_args+$(verifyMandatoryArgument ARTIFACTS_BUCKET b "$ARTIFACTS_BUCKET")))

# either an existing kms key id should be provided, or an owner identified for a new one
if [ -z "$KMS_KEY_ID" ]; then
    if [ -z "$KMS_KEY_OWNER" ]; then
        echo "Either (-k) KMS_KEY_ID or (-K) KMS_KEY_OWNER must be provided"
        incorrect_args=$((incorrect_args+1))
    fi
else
    KMS_KEY_OWNER='cms'
fi

if [[ "incorrect_args" -gt 0 ]]; then
    help_message; exit 1;
fi

if [ -z "$AWS_REGION" ]; then
	AWS_REGION=$(aws configure get region $AWS_ARGS)
fi

AWS_ARGS=$(buildAwsArgs "$AWS_REGION" "$AWS_PROFILE" )
AWS_SCRIPT_ARGS=$(buildAwsScriptArgs "$AWS_REGION" "$AWS_PROFILE" )

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query 'Account' $AWS_ARGS)


##########################################################
######  confirm whether to proceed or not           ######
##########################################################

config_message="
**********************************************************
*****   AWS Connected Mobility Solution             ******
**********************************************************

The AWS Connected Mobility Solution (CMS) will install using the following configuration:

    -e (ENVIRONMENT)                    : $ENVIRONMENT
    -E (CONFIG_ENVIRONMENT)             : $CONFIG_ENVIRONMENT

    -l (CDF_CORE_ENVIRONMENT)           : $CDF_CORE_ENVIRONMENT
    -b (ARTIFACTS_BUCKET)               : $ARTIFACTS_BUCKET
    -h (ADMIN_EMAIL)                    : $ADMIN_EMAIL
    -k (KMS_KEY_ID)                     : $KMS_KEY_ID
    -K (KMS_KEY_OWNER)                  : $KMS_KEY_OWNER"

config_message+="
    -R (AWS_REGION)                     : $AWS_REGION
    -P (AWS_PROFILE)                    : $AWS_PROFILE
        AWS_ACCOUNT_ID                  : $AWS_ACCOUNT_ID
    -B (BYPASS_BUNDLE)                  : $BYPASS_BUNDLE"

if [[ -z "$BYPASS_BUNDLE" ]]; then
    config_message+='not provided, therefore each TypeScript project will be bundled'
fi

asksure "$config_message" $BYPASS_PROMPT


if [ -z "$BYPASS_BUNDLE" ]; then
    logTitle 'Bundling applications'
    $root_dir/infrastructure/bundle.bash
fi

logTitle 'Packaging the CMS CloudFormation template and uploading to S3'

## package fleetmanager backend
cd $root_dir/packages/fleetmanager-backend
./package.bash

cd $root_dir

aws cloudformation package \
  --template-file $cwd/cfn-cms-parent.yaml \
  --output-template-file $cwd/build/cfn-cms-parent-output.yaml \
  --s3-bucket $ARTIFACTS_BUCKET \
  --s3-prefix packaged-cfn-artifacts \
  $AWS_ARGS

logTitle 'CMS packaging complete!'

stack_exports=$(aws cloudformation list-exports $AWS_ARGS)
assetlibrary_invoke_apifunctionname_export="cdf-assetlibrary-$CDF_CORE_ENVIRONMENT-restApiFunctionName"
commands_invoke_apifunctionname_export="cdf-commands-$CDF_CORE_ENVIRONMENT-restApiFunctionName"
provisioning_invoke_apifunctionname_export="cdf-provisioning-$CDF_CORE_ENVIRONMENT-restApiFunctionName"
vpcId_export="cdf-network-$CDF_CORE_ENVIRONMENT-VpcId"
privateSubnets_export="cdf-network-$CDF_CORE_ENVIRONMENT-PrivateSubnetIds"
securityGroup_export="cdf-network-$CDF_CORE_ENVIRONMENT-SecurityGroupId"

assetlibrary_invoke_apifunctionname=$(echo ${stack_exports} \
    | jq -r --arg assetlibrary_invoke_apifunctionname_export "$assetlibrary_invoke_apifunctionname_export" \
    '.Exports[] | select(.Name==$assetlibrary_invoke_apifunctionname_export) | .Value'
)

commands_invoke_apifunctionname=$(echo ${stack_exports} \
    | jq -r --arg commands_invoke_apifunctionname_export "$commands_invoke_apifunctionname_export" \
    '.Exports[] | select(.Name==$commands_invoke_apifunctionname_export) | .Value'
)

provisioning_invoke_apifunctionname=$(echo ${stack_exports} \
    | jq -r --arg provisioning_invoke_apifunctionname_export "$provisioning_invoke_apifunctionname_export" \
    '.Exports[] | select(.Name==$provisioning_invoke_apifunctionname_export) | .Value'
)

vpcId=$(echo ${stack_exports} \
    | jq -r --arg vpcId_export "$vpcId_export" \
    '.Exports[] | select(.Name==$vpcId_export) | .Value'
)

securityGroup=$(echo ${stack_exports} \
    | jq -r --arg securityGroup_export "$securityGroup_export" \
    '.Exports[] | select(.Name==$securityGroup_export) | .Value'
)

privateSubnets=$(echo ${stack_exports} \
    | jq -r --arg privateSubnets_export "$privateSubnets_export" \
    '.Exports[] | select(.Name==$privateSubnets_export) | .Value'
)

privateSubnets=$(echo $privateSubnets | sed -e 's/\,/\\\,/')

stack_name="cms-$ENVIRONMENT"

existing_stack=$(aws cloudformation describe-stacks --stack-name "$stack_name" $AWS_ARGS || true)
if [ -z "$existing_stack" ]; then
    change_set_type=CREATE
else
    change_set_type=UPDATE
fi

## NOTE: creating stack and using change-sets rather than the simpler
## higher level package / deploy methods so that we can disable rollback
## on failure to aid debugging failures

if [ "$change_set_type" = "CREATE" ]; then
    logTitle 'Creating stack'

    aws cloudformation create-stack \
        --stack-name $stack_name \
        --template-body "file://$cwd/build/cfn-cms-parent-output.yaml" \
        --parameters \
            ParameterKey=AdministratorEmail,ParameterValue=$ADMIN_EMAIL \
            ParameterKey=ArtifactsBucket,ParameterValue=$ARTIFACTS_BUCKET \
            ParameterKey=CDFCoreAssetLibraryApiFunctionName,ParameterValue=$assetlibrary_invoke_apifunctionname \
            ParameterKey=CDFCoreCommandsApiFunctionName,ParameterValue=$commands_invoke_apifunctionname \
            ParameterKey=CDFCoreProvisioningApiFunctionName,ParameterValue=$provisioning_invoke_apifunctionname \
            ParameterKey=CDFPrivateSubNetIds,ParameterValue=$privateSubnets \
            ParameterKey=CDFSecurityGroupId,ParameterValue=$securityGroup \
            ParameterKey=CDFVpcId,ParameterValue=$vpcId \
            ParameterKey=CopyAssetsFromSource,ParameterValue="false" \
            ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
            ParameterKey=KmsKeyId,ParameterValue=$KMS_KEY_ID \
            ParameterKey=KmsKeyOwner,ParameterValue=$KMS_KEY_OWNER \
        --disable-rollback \
        --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
        $AWS_ARGS
else

    logTitle 'Creating change set'

    change_set_name=cdf-core-$ENVIRONMENT-$(date +%s)

    aws cloudformation create-change-set \
        --stack-name $stack_name \
        --template-body "file://$cwd/build/cfn-cms-parent-output.yaml" \
        --parameters \
            ParameterKey=AdministratorEmail,ParameterValue=$ADMIN_EMAIL \
            ParameterKey=ArtifactsBucket,ParameterValue=$ARTIFACTS_BUCKET \
            ParameterKey=CDFCoreAssetLibraryApiFunctionName,ParameterValue=$assetlibrary_invoke_apifunctionname \
            ParameterKey=CDFCoreCommandsApiFunctionName,ParameterValue=$commands_invoke_apifunctionname \
            ParameterKey=CDFCoreProvisioningApiFunctionName,ParameterValue=$provisioning_invoke_apifunctionname \
            ParameterKey=CDFPrivateSubNetIds,ParameterValue=$privateSubnets \
            ParameterKey=CDFSecurityGroupId,ParameterValue=$securityGroup \
            ParameterKey=CDFVpcId,ParameterValue=$vpcId \
            ParameterKey=CopyAssetsFromSource,ParameterValue="false" \
            ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
            ParameterKey=KmsKeyId,ParameterValue=$KMS_KEY_ID \
            ParameterKey=KmsKeyOwner,ParameterValue=$KMS_KEY_OWNER \
        --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
        --change-set-name=$change_set_name \
        --change-set-type=$change_set_type \
        $AWS_ARGS

    logTitle 'Waiting for changset creation'

    while true; do
        change_set_status=$(aws cloudformation describe-change-set  --change-set-name=$change_set_name --stack-name $stack_name $AWS_ARGS |
        jq -r '.Status')
        echo "change_set_status: $change_set_status"
        if [ "$change_set_status" = "CREATE_COMPLETE" ] || [ "$change_set_status" = "FAILED" ]; then
            break
        fi
        sleep 1
    done

    logTitle 'Executing change set'
    aws cloudformation execute-change-set \
        --change-set-name=$change_set_name \
        --stack-name $stack_name \
        $AWS_ARGS

fi

while true; do
  stack_status=$(aws cloudformation describe-stacks --stack-name $stack_name $AWS_ARGS | jq -r '.Stacks[0].StackStatus')
  echo "stack_status: $stack_status"

  case "$stack_status" in
  "CREATE_FAILED" | "ROLLBACK_FAILED" | "ROLLBACK_COMPLETE" | "DELETE_FAILED" | "DELETE_COMPLETE" | "UPDATE_ROLLBACK_FAILED" | "UPDATE_ROLLBACK_COMPLETE" | "IMPORT_ROLLBACK_FAILED")
      failed=true
      break
      ;;
  "CREATE_COMPLETE" | "UPDATE_COMPLETE" | "IMPORT_ROLLBACK_COMPLETE")
      break
      ;;
  *)
      sleep 5
      ;;
  esac
done

if [ "$failed" = "true" ]; then
  logTitle "Failed! Check CloudFormation stack for further information"
  exit -1
fi

# script to upload the fleet manager UI to S3
cms_ui_bucket_export="$stack_name-websiteBucket"
cms_userpool_id_export="$stack_name-userPoolId"
cms_userpool_client_id_export="$stack_name-userPoolClientId"
cms_apigateway_url_export="$stack_name-fleetmanager-apiGatewayUrl"

stack_exports=$(aws cloudformation list-exports $AWS_ARGS)
cms_ui_bucket=$(echo ${stack_exports} \
    | jq -r --arg cms_ui_bucket_export "$cms_ui_bucket_export" \
    '.Exports[] | select(.Name==$cms_ui_bucket_export) | .Value'
)
cms_userpool_id=$(echo ${stack_exports} \
    | jq -r --arg cms_userpool_id_export "$cms_userpool_id_export" \
    '.Exports[] | select(.Name==$cms_userpool_id_export) | .Value'
)
cms_userpool_client_id=$(echo ${stack_exports} \
    | jq -r --arg cms_userpool_client_id_export "$cms_userpool_client_id_export" \
    '.Exports[] | select(.Name==$cms_userpool_client_id_export) | .Value'
)
cms_apigateway_url=$(echo ${stack_exports} \
  | jq -r --arg cms_apigateway_url_export "$cms_apigateway_url_export" \
  '.Exports[] | select(.Name==$cms_apigateway_url_export) | .Value'
)

appVariables="$root_dir/packages/fleetmanager-ui/build/assets/appVariables.js"
sed -i -e "s/%%USER_POOL_ID%%/$cms_userpool_id/g" $appVariables
sed -i -e "s/%%USER_POOL_CLIENT_ID%%/$cms_userpool_client_id/g" $appVariables
sed -i -e "s#%%CDF_AUTO_ENDPOINT%%#${cms_apigateway_url}#g" $appVariables
sed -i -e "s/%%REGION%%/$AWS_REGION/g" $appVariables

aws s3 sync --delete "$root_dir/packages/fleetmanager-ui/build" s3://$cms_ui_bucket  $AWS_ARGS

# add script to upload the simulation modules to S3
aws s3 cp "$root_dir/packages/simulation-modules/auto-route-gen/auto-route-gen.zip" s3://$ARTIFACTS_BUCKET/simulations/modules/auto-route-gen.zip $AWS_ARGS
aws s3 cp "$root_dir/packages/simulation-modules/auto-simulation-engine/simulation-engine.zip" s3://$ARTIFACTS_BUCKET/simulations/modules/simulation-engine.zip $AWS_ARGS
aws s3 cp "$root_dir/packages/simulation-modules/data-generator-auto/data-generator.zip" s3://$ARTIFACTS_BUCKET/simulations/modules/data-generator.zip $AWS_ARGS

logTitle 'CMS deployment complete!'
