# AWS Connected Mobility Solution (CMS)
Connected Mobility Solution (CMS) enters its next generation of well architected design, following the original Connected Vehicle Reference Architecture in 2017. CMS has added capability based on lessons learned from hundreds of partner engagements and thousands of activations. CMS aids OEMs and suppliers in their journey to becoming mobility service providers. It includes the broadest and most advanced set of building blocks to accelerate the development and global scale deployment on a pay-as-you-go basis for these capabilities. 

## Install Prerequisites
In the terminal window (bash shell), the following steps will setup the necessary prerequisite packages.  We recommend using your Cloud9 environment to build and deploy CMS.  Additionally, some of the commands below require [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html), and Python 3.7, if not using Cloud9 as your IDE and [Git](https://git-scm.com/downloads), please configure as appropriate.

```
nvm install 14
npm install -g @microsoft/rush
sudo yum install -y jq
```

For some of the AWS CLI commands to work below as expected (namely the KMS key owner) please configure the executing account to have an IAM user associated using ```aws configure``` to ensure the CLI commands work correctly.

The CMS solution requires the [AWS Connected Device Framework (CDF)](https://github.com/aws/aws-connected-device-framework) to be installed in the same account.  Please follow the instructions [here](https://github.com/aws/aws-connected-device-framework/blob/main/source/docs/deployment.md) to install and configure the AWS Connected Device Framwork. Once this is configured and installed, you will pass in the name of the CDF stack into your deploy process for CMS. The recommended deployment method of CDF for CMS is the ```deploy-core-single-stack.bash``` script (ensure the -c parameter is not passed for ease of installation), ensure both buckets are named the same development artifacts.

## Build + Deploy Connected Device Framework
The following steps will allow you to build and deploy CMS into your account.

1. Setup S3 bucket

    ```
    # change to desired region if needed
    export region=us-west-2

    export acct_id=$(aws sts get-caller-identity --query 'Account' --output text)

    export s3_bucket_name=$(aws s3api create-bucket --bucket cms-demo-refactored-$acct_id --create-bucket-configuration LocationConstraint=$region | jq '.Location' | tr -d "\"" | cut -d "." -f1 | cut -d "/" -f3)
    ```

2. Create EC2 keypair. Alternatively, an existing keypair can be re-used. Simply set the variable $keypair_name to the existing pair.

    ```
    # change the name below if desired 
    export keypair_name=myDemoKP
    rm -f ~/.ssh/$keypair_name.pem
    aws ec2 create-key-pair --key-name $keypair_name --query 'KeyMaterial' --output text >~/.ssh/$keypair_name.pem
    chmod 400 ~/.ssh/$keypair_name.pem
    ```

3. Use the below commannd to then deploy CDF from the ```source``` directory:

```
    ./infrastructure/deploy-core-single-stack.bash \
        -e development \
        -b $s3_bucket_name \
        -p $keypair_name \
        -R $region \
        -y s3://$s3_bucket_name/template-snippets/ \
        -i 0.0.0.0/0 
```

## Build + Deploy Connected Mobility Solution
The following steps will allow you to build and deploy CMS into your account.

1. Clone the CMS repository using the following command

    ```
    git clone https://github.com/aws-solutions/aws-connected-mobility-solution
    ```

2. Build CMS (approximately 10 minutes)

    ```
    cd ~/environment/aws-connected-mobility-solution/source 
    rush bundle
    ```

3. Set environment variables. Set your email to be the CMS admin in the Cloud Formation stack.

    ```
    export env_name=development 
    export aws_profile=default

    export kms_key_owner=$(aws iam get-user --query 'User.UserName' --output text)
    # BE SURE TO PASTE YOUR EMAIL BELOW
    export cms_admin_email=PASTE_YOUR_EMAIL_HERE
    export acct_id=$(aws sts get-caller-identity --query 'Account' --output text) 
    export cdf_core_stack_name=$env_name
    ```

4. Deploy CMS

  ```
  cd ~/environment/aws-connected-mobility-solution/source

  ./infrastructure/deploy.bash -e $env_name -k $keypair_name -K $kms_key_owner -h $cms_admin_email -b $s3_bucket_name -B -P $aws_profile -l $cdf_core_stack_name -R $region
  
  ```

## Run Simulations
The quickest way to simulate a fleet of vehicles in CMS is to use the provided simulation module.  This package will provision vehicles into your CMS account and simulate routes, events and telemetry within a geographical bounding box provided in the inputs

### Simulation prerequisites
• Download and install [Postman](https://www.postman.com/downloads/), then import the [collection](/source/packages/simulation-modules/CMS-Simulators.postman_collection.json) before proceeding.
• Log in to the Fleet Manager UI with the access credentials you wish to use.
• Mapbox API token (as described in “Build and Deploy CMS from Source”
 
 ### Step 1—Provision Simulation Capacity

 1. Open the request in Postman - `CMS Simulators - Create Simulation`

 2. Create an *Environment* in Postman specific to your project and create these global variables:
    - simulation_manager_base_url
    - mapboxToken
    - certificateId
    - facadeApiFunctionName
    - simulation_id
    - cognito_id_token

3. Locate the following parameters from the CloudFormation Outputs: **apiGatewayUrl**,**certificateId**, **façade-restApiFunctionName**.
    • From the Cloud9 Terminal window, the following commands will extract these names. Alternatively, they can be found from the CloudFormation console. However, many of the outputs have similar names and using these commands will help to avoid errors.

    ```
    echo "simulation_manager_base_url:"  $(aws cloudformation list-exports --query "Exports[?Name=='cdf-simulation-manager-development-apigatewayurl'].Value" --output text) && echo "certificateId:" $(aws cloudformation list-exports --query "Exports[?Name=='cms-$env_name-certificateId'].Value" --output text) && echo "facadeApiFunctionName:" $(aws cloudformation list-exports --query "Exports[?Name=='cms-$env_name-facade-restApiFunctionName'].Value" --output text) 

    ```

4. Copy the values and paste into the 'Current Value's for each of these variables in Postman. Leave cognito_id_token and simulation_id blank. All other values should be filled out in the Postman environment.

5. Login to the FleetManager app and capture the cognito id token from the browser by
    • Open debugger in the web browser (Developer tools in Chrome/Firefox)
    • Inspect "Local Storage" from the "Application" tab
    • Look for "CognitoIdentity....idToken" and copy the Value— be sure to "Select All" and Copy, otherwise, intermediate word breaks may copy only part of the token.
    • paste the value into the cognito_id_token Postman environment variable.

6. Send the POST request to Create the initial Simulation. A succesful request will return a response body of the below, but with a unique and different simulation Id.  This will automatically be saved to the variables for the Run Simulation request.

```
/simulations/2-6QR4Qmo
 
2-6QR4Qmo
```

7. Inspect the body of the Run Simulations request and adjust deviceCount, region1, and region2 properties as desired. 

**When Provisioning is complete, the requested number of 'cars' should be visible on the map in initial locations, but will not be moving.**

### Step 2—Start the Simulation

1. Open the `2 - Run Simulation` request in Postman. Review the deviceCount parameter in the `body` of the request. If this number is greater than the number provisioned in Step 1, a timeout could occur.
2. If you recently provisioned the simulation, simply 'Send' the request. If it has been some time, or if you receive and authorization error, refresh the cognito_id_token value as in Step 1. If you wish to run a simulation with a different ID, change the simulation_id value in the environment.

If you receive a Timeout error from the Request, it is likely that the simulations have not yet finished being provisioned. Wait until the cars are visible on the map—generally about 5 - 10 minutes, but could be longer for a large number of devices.

A '204' response indicates the simulations have been successfully started.

## Create a manual fleet
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
//TODO: update
```
|-deployment/
  |-build-s3-dist.sh             [ shell script for packaging distribution assets ]
  |-run-unit-tests.sh            [ shell script for executing unit tests ]
|-source/
  |-packages         
    |-cdf-auto-cvra                     [ CVRA module ]
    |-cdf-auto-facade                   [ CDF Facade module ]
    |-cdf-auto-fleetmanager-backend     [ CMS Fleetmanager backend ]
    |-cdf-auto-fleetmanager-ui          [ CMS Fleetmanager UI ]
    |-cdf-auto-infrastructure           [ CDF Infrastructure module ]
    |-cdf-auto-simulation-modules       [ CDF Simulation Modules ]
        |-auto-route-gen                [ CMS Route Generation Module ]
        |-auto-simulation-engine        [ CMS Simulation Engine ]
        |-data-generator-auto           [ CMS Data generator ]
    |-cdf-auto-clients                  [ CDF Clients Module ]

```

***


Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://www.apache.org/licenses/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and limitations under the License.
