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
    -h (string)   The email of the Admin Owner
    -p (string)   The name of the Keypair used to deploy Bastion host

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

    VPC OPTIONS (If deploying in an existing VPC):
    ------------------
    -N (flag)     Use an existing VPC instead of creating a new one.
    -v (string)   ID of VPC to deploy into (required if -N set)
    -g (string)   ID of CDF security group (required if -N set)
    -n (string)   ID of private subnets (comma delimited) (required if -N set)
    -o (string)   ID of public subnets (comma delimited) (required if -N set)
    -c (string)   ID of VPC endpoint (required if -N set)
    -r (string)   ID of private route tables (comma delimited) (required if -N set)

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

while getopts ":e:b:h:p:E:K:k:BYN:v:g:n:o:c:r:R:P:" opt; do
  case $opt in
    e  ) ENVIRONMENT=$OPTARG;;
    b  ) ARTIFACTS_BUCKET=$OPTARG;;
    h  ) ADMIN_EMAIL=$OPTARG;;
    p  ) BASTION_KEYPAIR_NAME=$OPTARG;;
    E  ) CONFIG_ENVIRONMENT=$OPTARG;;

    k  ) KMS_KEY_ID=$OPTARG;;
    K  ) KMS_KEY_OWNER=$OPTARG;;

    B  ) BYPASS_BUNDLE=true;;
    Y  ) BYPASS_PROMPT=true;;

    N  ) USE_EXISTING_VPC=true;;
    v  ) VPC_ID=$OPTARG;;
    g  ) CDF_SECURITY_GROUP_ID=$OPTARG;;
    n  ) PRIVATE_SUBNET_IDS=$OPTARG;;
    o  ) PUBLIC_SUBNET_IDS=$OPTARG;;
    c  ) PRIVATE_ENDPOINT_ID=$OPTARG;;
    r  ) PRIVATE_ROUTE_TABLE_IDS=$OPTARG;;

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
incorrect_args=$((incorrect_args+$(verifyMandatoryArgument BASTION_KEYPAIR_NAME p $BASTION_KEYPAIR_NAME)))
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
*****   Connected Mobility Solution           ******
**********************************************************

The Connected Device Framework (CDF) will install using the following configuration:

    -e (ENVIRONMENT)                    : $ENVIRONMENT
    -E (CONFIG_ENVIRONMENT)             : $CONFIG_ENVIRONMENT

    -b (ARTIFACTS_BUCKET)               : $ARTIFACTS_BUCKET
    -h (ADMIN_EMAIL)                    : $ADMIN_EMAIL
    -k (KMS_KEY_ID)                     : $KMS_KEY_ID
    -K (KMS_KEY_OWNER)                  : $KMS_KEY_OWNER
    -p (BASTION_KEYPAIR_NAME)           : $BASTION_KEYPAIR_NAME

    -N (USE_EXISTING_VPC)               : $USE_EXISTING_VPC"

if [[ -z "$USE_EXISTING_VPC" ]]; then
    config_message+='not provided, therefore a new vpc will be created'
else
    config_message+="
    -v (VPC_ID)                         : $VPC_ID
    -g (CDF_SECURITY_GROUP_ID)          : $CDF_SECURITY_GROUP_ID
    -n (PRIVATE_SUBNET_IDS)             : $PRIVATE_SUBNET_IDS
    -o (PUBLIC_SUBNET_IDS)              : $PUBLIC_SUBNET_IDS
    -c (PRIVATE_ENDPOINT_ID)            : $PRIVATE_ENDPOINT_ID
    -r (PRIVATE_ROUTE_TABLE_IDS)        : $PRIVATE_ROUTE_TABLE_IDS"
fi

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
    $root_dir/infrastructure/bundle-core.bash

   cd ../../cdf-core/source
   ./infrastructure/bundle-core.bash

   cd $root_dir
fi


logTitle 'Deploying Simulation Launcher JMeter Container'

repositoryUri="cdf-jmeter-"$ENVIRONMENT

if [[ -z "$ECR_REPO" ]]; then
    repositoryUri="cdf-jmeter-"$ENVIRONMENT
else
    repositoryUri=$ECR_REPO
    AWS_SCRIPT_ARGS=$(buildAwsScriptArgs "us-east-1" "$AWS_PROFILE" )
fi

cd "../../cdf-core/source/packages/services/simulation-launcher/src/containers/jmeter/infrastructure"
./deploy.bash -r $repositoryUri  $AWS_SCRIPT_ARGS

if [ -z "$USE_EXISTING_VPC" ]; then
    # if private api auth, or asset library full mode, is configured then these will get overwritten
    VPC_ID='N/A'
    CDF_SECURITY_GROUP_ID='N/A'
    PRIVATE_SUBNET_IDS='N/A'
    PRIVATE_ENDPOINT_ID='N/A'
    PRIVATE_ROUTE_TABLE_IDS='N/A'
fi

stack_name="cms-$ENVIRONMENT"

## package fleetmanager backend
cd $root_dir/packages/fleetmanager-backend
./package.bash

cd $root_dir

aws cloudformation package \
  --template-file $cwd/cfn-cms-parent-full.yaml \
  --output-template-file $cwd/build/cfn-cms-parent-full-output.yaml \
  --s3-bucket $ARTIFACTS_BUCKET \
  --s3-prefix packaged-cfn-artifacts \
  $AWS_ARGS

logTitle 'CMS packaging complete!'

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
        --template-body "file://$cwd/build/cfn-cms-parent-full-output.yaml" \
        --parameters \
            ParameterKey=AdministratorEmail,ParameterValue=$ADMIN_EMAIL \
            ParameterKey=ArtifactsBucket,ParameterValue=$ARTIFACTS_BUCKET \
            ParameterKey=BastionKeyPairName,ParameterValue=$BASTION_KEYPAIR_NAME \
            ParameterKey=CopyAssetsFromSource,ParameterValue="false" \
            ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
            ParameterKey=ExistingVpcId,ParameterValue=$VPC_ID \
            ParameterKey=ExistingCDFSecurityGroupId,ParameterValue=$CDF_SECURITY_GROUP_ID \
            ParameterKey=ExistingPrivateSubNetIds,ParameterValue=$PRIVATE_SUBNET_IDS \
            ParameterKey=ExistingPrivateApiGatewayVPCEndpoint,ParameterValue=$PRIVATE_ENDPOINT_ID \
            ParameterKey=ExistingPrivateRouteTableIds,ParameterValue=$PRIVATE_ROUTE_TABLE_IDS \
            ParameterKey=JMeterRepoURI,ParameterValue=$repositoryUri \
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
        --template-body "file://$cwd/build/cfn-cms-parent-full-output.yaml" \
        --parameters \
            ParameterKey=AdministratorEmail,ParameterValue=$ADMIN_EMAIL \
            ParameterKey=ArtifactsBucket,ParameterValue=$ARTIFACTS_BUCKET \
            ParameterKey=BastionKeyPairName,ParameterValue=$BASTION_KEYPAIR_NAME  \
            ParameterKey=CopyAssetsFromSource,ParameterValue="false" \
            ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
            ParameterKey=ExistingVpcId,ParameterValue=$VPC_ID \
            ParameterKey=ExistingCDFSecurityGroupId,ParameterValue=$CDF_SECURITY_GROUP_ID \
            ParameterKey=ExistingPrivateSubNetIds,ParameterValue=$PRIVATE_SUBNET_IDS \
            ParameterKey=ExistingPrivateApiGatewayVPCEndpoint,ParameterValue=$PRIVATE_ENDPOINT_ID \
            ParameterKey=ExistingPrivateRouteTableIds,ParameterValue=$PRIVATE_ROUTE_TABLE_IDS \
            ParameterKey=JMeterRepoURI,ParameterValue=$repositoryUri \
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
aws s3 cp "$root_dir/packages/simulation-modules/auto-route-gen/build/build.zip" s3://$ARTIFACTS_BUCKET/simulations/modules/auto-route-gen.zip $AWS_ARGS
aws s3 cp "$root_dir/packages/simulation-modules/auto-simulation-engine/build/build.zip" s3://$ARTIFACTS_BUCKET/simulations/modules/simulation-engine.zip $AWS_ARGS
aws s3 cp "$root_dir/packages/simulation-modules/data-generator-auto/build/build.zip" s3://$ARTIFACTS_BUCKET/simulations/modules/data-generator.zip $AWS_ARGS

logTitle 'CDF deployment complete!'
