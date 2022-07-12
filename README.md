# AWS Connected Mobility Solution (CMS)
Connected Mobility Solution (CMS) enters its next generation of well architected design, following the original Connected Vehicle Reference Architecture in 2017. CMS has added capability based on lessons learned from hundreds of partner engagements and thousands of activations. CMS aids OEMs and suppliers in their journey to becoming mobility service providers. It includes the broadest and most advanced set of building blocks to accelerate the development and global scale deployment on a pay-as-you-go basis for these capabilities. 

## Build with a single command

**New** Use the [launch_cms.yaml](https://github.com/aws-solutions/aws-connected-mobility-solution/blob/develop/source/infrastructure/launch_cms.yaml) to build the entire AWS Connected Mobility Solution.

1. Log into your AWS console and select **CloudFormation**

2. Download the launch_cms.yaml file from the AWS Connected Mobility Solution github repository to your local machine.

3. Select *Create a stack from existing resources* and select the launch_cms.yaml file you downloaded in step 2.

4. Select the defaults (or change the Cloud9 instance to large) and enter your email address in CMS Administrator field.

5. Click Next and Acknowledge this stack will create IAM resources.

6. This stack will create a Cloud9 instance which will then kick off two CloudFormation scripts, CDF and CMS.  You will receive an email after about 1.5 hours indicating sucess of the stack.

## Prerequisites
We recommend using your [AWS Cloud9 IDE](https://aws.amazon.com/cloud9) to build and deploy CMS. In all the other cases, make sure you have installed Python 3.7, [Git](https://git-scm.com/downloads) and [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html).

1. [Create a AWS Cloud9 environment](https://console.aws.amazon.com/cloud9/home/create) in the region of your choice, preferibly selecting a  *m5.large* instance type. 

2. During the creation of the AWS Cloud9 environment, it's not possible to choose the root volume size and the default (10 GiB) is not big enough to complete all the installation steps. So open your newly created AWS Cloud9 environment and [increase](https://docs.aws.amazon.com/cloud9/latest/user-guide/move-environment.html#move-environment-resize) the root volume to 25 GiB.

3. Install nodejs v14, rush and jq
    ```
    nvm install 14 --default
    npm install -g @microsoft/rush
    sudo yum install -y jq
    ```

## Install AWS Connected Device Framework
AWS CMS requires the [AWS Connected Device Framework (CDF)](https://github.com/aws/aws-connected-device-framework) to be installed in the same account.
The following steps will guide you to build and install AWS CDF. Feel free to refer back to [CDF deployment doc](https://github.com/aws/aws-connected-device-framework/blob/main/source/docs/deployment.md) for more details.

1. Set some environmental variables and then create an S3 bucket

    ```
    export ENV_NAME=development
    export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
    export CMS_BUCKET_NAME=cms-$ENV_NAME-$AWS_ACCOUNT_ID

    aws s3 mb s3://$CMS_BUCKET_NAME
    ```

2. Create EC2 keypair. Alternatively, an existing keypair can be re-used. Simply set the variable $keypair_name to the existing pair

    ```
    # change the name below if desired 
    export KEYPAIR_NAME=my-cms-development-key
    rm -f ~/.ssh/$KEYPAIR_NAME.pem
    aws ec2 create-key-pair --key-name $KEYPAIR_NAME --query 'KeyMaterial' --output text >~/.ssh/$KEYPAIR_NAME.pem
    chmod 400 ~/.ssh/$KEYPAIR_NAME.pem
    ```
3. Clone CDF repo

    ```
    git clone https://github.com/aws/aws-connected-device-framework.git
    ```

4. Apply patch to fix simulator provisioning service in CDF.

    ```
    cd ~/environment/aws-connected-device-framework/source/packages/services/provisioning/src/config
    wget --no-check-certificate --content-disposition https://raw.githubusercontent.com/aws-solutions/aws-connected-mobility-solution/develop/source/common/config/provisioning.patch
    git apply provisioning.patch
    ```

5. Use the below commannd to then deploy CDF

    ```
    cd ~/environment/aws-connected-device-framework/source 
    ./infrastructure/deploy-core-single-stack.bash \
        -e $ENV_NAME \
        -b $CMS_BUCKET_NAME \
        -p $KEYPAIR_NAME \
        -y s3://$CMS_BUCKET_NAME/template-snippets/ \
        -i 0.0.0.0/0 
    ```

## Install AWS Connected Mobility Solution
The following steps will allow you to build and deploy CMS into your account.

1. Clone the CMS repository using the following command

    ```
    git clone -b develop https://github.com/aws-solutions/aws-connected-mobility-solution.git
    ```

2. Build CMS (approximately 10 minutes)

    ```
    cd ~/environment/aws-connected-mobility-solution/source 
    rush bundle
    ```

3. Set the email of the CMS admin and the IAM user that will own the KMS key

    ```
    # BE SURE TO PASTE YOUR EMAIL BELOW
    export CMS_ADMIN_EMAIL=PASTE_YOUR_EMAIL_HERE
    # To get current IAM username you can use command "aws iam get-user --query 'User.UserName' --output text" 
    # otherwise you would need to create one and insert it below
    export KMS_KEY_OWNER=INSERT_IAM_USERNAME
    ```

4. Deploy CMS

    ```
    ./infrastructure/deploy.bash \
        -e $ENV_NAME \
        -l $ENV_NAME \
        -K $KMS_KEY_OWNER \
        -h $CMS_ADMIN_EMAIL \
        -b $CMS_BUCKET_NAME \
        -B
    ```

5. After the installation is completed, an email will be sent to CMS_ADMIN_EMAIL address with the url of the Fleet Manager app and a temporary password. Login with using CMS_ADMIN_EMAIL as username and the password indicated in the email you received. At first login, you will be asked to change the temporary password and insert a [Mapbox access token](https://docs.mapbox.com/help/getting-started/access-tokens/) you can get free of charge from MapBox. 

## Let's get things moving
We proposed two ways to onboard some vehicles and simulate them while they move around, generating events and other telemetry data.

### Simulation Manager
---
CMS has a build-in vehicle simulator which is based on CDF base modules. Download and install [Postman](https://www.postman.com/downloads/) and import the [collection](/source/packages/simulation-modules/CMS-Simulators.postman_collection.json) before proceeding.
 
 1. Create an new *Environment* in Postman add the following variables

    |Variable|How to get it|
    |-|-|
    |simulation_manager_base_url|run in a terminal in Cloud9 <br>```aws cloudformation list-exports --query "Exports[?Name=='cdf-simulation-manager-development-apigatewayurl'].Value" --output text```|
    |certificateId|run from a terminal in Cloud9 <br>```aws cloudformation list-exports --query "Exports[?Name=='cms-$ENV_NAME-certificateId'].Value" --output text```|
    |facadeApiFunctionName|run in a terminal in Cloud9 <br>```aws cloudformation list-exports --query "Exports[?Name=='cms-$ENV_NAME-facade-restApiFunctionName'].Value" --output text```|
    |mapboxToken|run in a terminal in Cloud9 <br>```aws ssm get-parameter --name mapboxToken \| jq -r ".Parameter.Value"```|
    |cognito_id_token|From the FleetManager app:<br> - Open debugger in the web browser (Developer tools in Chrome/Firefox) <br> - Inspect "Local Storage" from the "Application" tab<br> - Look for "CognitoIdentity....idToken" and copy the Value. Make sure to "Select All" and Copy, otherwise, intermediate word breaks may copy only part of the token.<br>**Please also note that this token will expire and you would have to get a new one**|
    |simulation_id | Leave it blank as it will be populated when we create the simulation at the next step |


2. Send a **Create Simulation** request. A successful request is the one that returns with the code 204

3. Send a **Run Simulation** request after reviewing the deviceCount parameter in the body of the request. If this number is greater than the number provisioned in Step 1, a timeout could occur. A successful request is the one that returns with the code 204. 

    > **_NOTE:_**  The simulation provisioning takes 5 min or longer depending from the number of vehicles. If the provisioning has not been completed the request to run the simulation at following point will timeout, this is expected behavior.

### Manual fleet
---
If you need more control over the creation of your fleet, AWS provides a sample set of tooling for creating single vehicles and posting sample telemetry called the [AWS CMS Telemetry Demo](https://github.com/aws-samples/aws-cms-telemetry-demo). This repository allows more control over the types of vehicles you create, and provides an automated way to provision all required attributes of vehicles into the Connected Mobility System on AWS.

The above repository automates using Python scripts the below process, if you wish to perform provisioning manually, follow the below steps.

This process describes the steps needed to create a new vehicle in CDF (Asset Library) and CMS (Fleet Manager). After completing these steps, you can create new device to send telemetry data (see “Connecting a Telematics Source”).

### Monitoring the process
To see the response from the Connected Device Framework, open up the AWS IoT Management Console, navigate to Test, and subscribe to cdf/#

### Creating a device entry with Postman
1. Open Postman and import the [CMS-Demo.postman_collection.json](/source/packages/fleetmanager-ui/CMS-Demo.postman_collection.json)
2. From the 'Environment' icon Edit the 'CMS-Demo-xxx' environment and set the current values as
collected in previous steps for
    • assetlibrary
    • facade_endpoint
    • certificateId
    • cognito_id_token
3. Additionally set environment values of your choice for
    • devicemakername (can be anything)
    • externalId (must be unique like a serial number or guid or append the account number for uniqueness)
    • thingname (unique for account, this is how your device will publish data)
    • username (unique for account)
    • firstName, lastName (for the user)
4. Update and close the environment editor.
5. Open the "1 - Create-Supplier (AssetLibrary)" request from the imported "CMS-Demo" collection. Click Send.
o an empty body with a 204 return code is normal.
6. Open the "2 - Create-User (Facade)" request. Click Send. if you get an unauthorized error, refresh and reset the cognito_id_token value in the environment.
7. Open the "3 - Register-Device (Facade)" request. Click Send.
o a 201 response with a certificate in the response body is expected.
8. Open the "4 - Activate-Device (Facade)" request. Make any changes desired to the Body of the request. NB- VIN numbers are verified at multiple steps in CMS and if not correctly formatted, other downstream errors may occur. Also note that the vehicle.ecus.type is hard-coded (tcu) to match the IoT Thing Type created when CMS was installed and is further hard-coded in request "3 - Register-Device (Facade)". Click Send.
o a 204 response code is normal
10. Open the"5-Associate-User-Car(AssetLibrary)"request. Click Send.
o verify the 204 response code
Done. You may now publish telemetry on dt/cvra/{thingName}/cardata.

## File Structure 
```
|-deployment/
  |-build-s3-dist.sh             [ shell script for packaging distribution assets ]
  |-run-unit-tests.sh            [ shell script for executing unit tests ]
|-source/
  |-packages         
    |-cvra                              [ CVRA module ]
    |-cdf-auto-facade                   [ CDF Facade module ]
    |-cdf-auto-fleetmanager-backend     [ CMS Fleetmanager backend ]
    |-cdf-auto-fleetmanager-ui          [ CMS Fleetmanager UI ]
    |-cdf-auto-simulation-modules       [ CDF Simulation Modules ]
        |-auto-route-gen                [ CMS Route Generation Module ]
        |-auto-simulation-engine        [ CMS Simulation Engine ]
        |-data-generator-auto           [ CMS Data generator ]
    |-cdf-clients                       [ CDF Clients Module ]

```

***


Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://www.apache.org/licenses/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
