# CDF Auto - Backend Services

The following sections are the AWS services and their use cases for all backend resources concerning CVRA CDF Auto solution



## Overview

This application is built using AWS Chalice. Chalice is a Python Serverless Microframework for AWS and allows you to quickly create and deploy applications that use Amazon API Gateway and AWS Lambda. AWS Serverless Application Model (AWS SAM) is an open-source framework that you can use to build serverless applications on AWS.




### High level architecture:

**APIs built for three purposes:**
* UI request data stored -> Elasticsearch
* UI request (GET/PUT) config values stored -> System Manager (Parameter Store)
* UI request (POST/GET) OTA (Over The Air) functionality


**IoT Section**
Provisioned devices on vehicles will publish telemetry on IoT topics. Each topic has an IoT rule that sends the data payload to a specific AWS lambda. Each AWS lambda will send the data to a specific Elasticsearch index according to its business rules.



### IoT

**List of IoT Topics --> Associated AWS Lambdas:**
```
* cdf/assetlibrary/events/devices/# --> cdf_auto-fleetmanager-deviceEvent-{cloudformation given ID}

* cdf/assetlibrary/events/groups/# --> cdf_auto-fleetmanager-groupEvent-{cloudformation given ID}

* dt/cvra/+/cardata --> cdf_auto-fleetmanager-telemetryRule-{cloudformation given ID}

* dt/cvra/+/dtc --> cdf_auto-fleetmanager-dtcRule-{cloudformation given ID}

* dt/cvra/+/trip --> cdf_auto-fleetmanager-tripsRule-{cloudformation given ID}

* dt/cvra/+/event --> cdf_auto-fleetmanager-eventRule-{cloudformation given ID}

* $aws/events/jobExecution/# --> cdf_auto-fleetmanager-otaRule-{cloudformation given ID}
```

**IoT Rule Error**
Any error transferring published data from an IoT rule, send error message to S3 bucket:
```
* cdf-auto-fleetmanager-iotrule-datatransfer-error
```



### API Gateway

**API name:**
```
* cdf-auto-fleetmanager-backend
```

**List of API Endpoints and Associated AWS Lambda**

Since this application is using Chalice, all APIs created will be referenced by one AWS lambda
```
* cdf-auto-fleetmanager-APIHandler-{cloudformation given ID}
```

Think of this lambda as encapsilating all functionality for every endpoint and their resources.
Within the Chalice application there are many resources being used by each api endpoint, such as libraries, model schemas, json templates and more.

Environmental Variables
```
ES_ENDPOINT: Elasticsearch endpoint
COMMANDS_URL: CDF Commands endpoint
```

List of endpoints:

#### Config
```
/config
Action: GET/PUT values with AWS Parameter Store
```

#### OTA

Selection of filter criteria is necessary to create an OTA job for a selection of devices / vehicles. There are some limitations, in terms of what parameters are available (see in Current Issues section).

```
/ota
Action: returns all jobs

/ota/create
Action: create a new job

/ota/create/{device_id}
Action: create new job for single device

/ota/{job_id}
Action: return job details

/ota/{job_id}/devices
Action: return all devices for job

/ota/{job_id}/devices/status
Action: return job status for every device
```

#### Vehicle
```
/vehicles/aggregate
Action: return cluster data and paginated vehicles per filter params

/vehicles/filter
Action: return non-paginated vehicles per filter params (max 10000) for zoomed in view (animation)

/vehicles/lookup
Action: return single vehicle per bbox param (used when cluster data is only 1 vehicle)

/vehicles/{vin}
Action: return single vehicle per vin

/vehicles/route/{trip_id}
Action: return vehicle route per trip_id

/vehicles/{vin}/events
Action: return paginated vehicle events per vin

/vehicles/{vin}/trips
Action: return paginated vehicle trips per vin
```



### Dynamo DB

This application does not create the DDB service nor the table needed, but it does reference a specific table as part of the anomaly data flow.

New anomaly is added to the DDB table:
```
* cvra-development-VehicleAnomalyTable-{cloudformation given ID}
```

A set trigger sends the payload to AWS lambda:
```
* cdf-auto-fleetmanager-telemetryAnomalyDDBtoES-{cloudformation given ID}
```

AWS lambda maps data and sends the payload to Elasticsearch indices:
```
anomaly
shared_cardata
```



### AWS Lambda
The lambdas discussed in this section are the ones related to IoT Rules in the previous section. This will give a more detailed explaination on their functionality.

Lambda Layers
```
Name: lambdaLayer (versioning)
Contains: python libraries & util function (cdf_auto_fleetmanager_data_key_cleaner.py)
```

Environmental Variables
```
ES_ENDPOINT: Elasticsearch endpoint
ASSET_LIBRARY_URL: CDF Asset Library endpoint
```

**List of IoT Lambdas**
```
* cdf-auto-fleetmanager-telemetryAnomalyDDBtoES-{cloudformation given ID}
Overview: map anomaly data from ddb and send to elasticsearch indices (anomaly & shared_cardata)

* cdf-auto-fleetmanager-deviceEvent-{cloudformation given ID}
Overview: map provisioned device data and send to elasticsearch index (devices)

* cdf-auto-fleetmanager-groupEvent-{cloudformation given ID}
Overview: map incoming group data (vin & static info) with device data (device_id & software version) and send to elasticsaerch index (shared_cardata)

* cdf-auto-fleetmanager-dtcRule-{cloudformation given ID}
Overview: send incoming dtc data to elasticsearch indices (dtc & shared_cardata)

* cdf-auto-fleetmanager-eventRule-{cloudformation given ID}
Overview: send incoming event data to elasticsearch index (event)

* cdf-auto-fleetmanager-otaRule-{cloudformation given ID}
Overview: evaluate incoming ota data based on conditional message of, 'successful' ota job. Once condition is met, there are two tasks:
1. query elasticsearch index (shared_cardata) for the vehicle vin based on the incoming device_id (part of the ota message)
2. query cdf asset library for the new software version based on the job details (device_id)

With these two new pieces of information (vin & software version), update elasticsearch indices (shared_cardata & cardata) with the new software version.

* cdf-auto-fleetmanager-telemetryRule-{cloudformation given ID}
Overview: incoming telemetry data queries elasticsearch index (shared_cardata) and appends the response to its payload (static / dtc / anomaly), then sends the entire payload to elasticsearch indices (latest_telemetry & cardata: w/out the dtc & anomay data).

* cdf-auto-fleetmanager-tripsRule-{cloudformation given ID}
Overview: send incoming trip data to elasticsearch index (trip)
```

**Custom Resource Lambdas**
```
* cdf_auto_fleetmanager_elasticsearch_helper
Overview: part of Cloudformation's deployment, once elasticsearch is up & running, this lambda creates all the necessary indices and their mappings to ensure data is correctly written & queried

* cdf_auto_fleetmanager_iot_event_config
Overview: configuration in IoT settings for event-based messages that will allow for job execution to be published to MQTT topic (see otaRule above)
```



### S3
```
* cdf-auto-fleetmanager-iot-rule-error
Overview: as mentioned above in the IoT section, if there is an error transferring data from a topic -> lambda, an error log is written to this bucket. The is error is set to detail which topic was in error and why.

* cdf-auto-fleetmanager-backend-cf-bucket
Overview: as mentioned above in the Chalice overview section, when Chalice creates a build, the artifacts & sam template are stored here for a Cloudformation deployment.
```



### Elasticsearch
Elasticsearch is used to store all published device data on IoT MQTT topics (see IoT section). API endpoints allow the UI to fully integrate this data, which makes the UX as close to a live view as possible.

**List of Indices**
```
* devices
* shared_cardata (static + dtc & anomaly)
* cardata (all telemetry)
* latest_telemetry
* trip
* dtc (historical)
* anomaly (historical)
* event
```

**Mapping for Indices**
```
* shared_cardata

"devices": {
    "type": "nested",
    "properties": {
        "deviceid": {
            "type": "keyword"
        },
        "softwareversion": {
            "type": "keyword"
        }
    }
},
"trouble_codes": {
    "type": "nested",
    "properties": {
        "code": {
            "type": "keyword"
        }
    }
},
"anomalies": {
    "type": "nested",
    "properties": {
        "anomaly_type": {
            "type": "keyword"
        }
    }
}

* cardata

"geolocation.location": {
    "type": "geo_point"
},
"sendtimestamp": {
    "type": "date",
    "format": "date_optional_time"
},
"devices": {
    "type": "nested",
    "properties": {
        "deviceid": {
            "type": "keyword"
        },
        "softwareversion": {
            "type": "keyword"
        }
    }
},
"trouble_codes": {
    "type": "nested",
    "properties": {
        "code": {
            "type": "keyword"
        }
    }
},
"anomalies": {
    "type": "nested",
    "properties": {
        "anomaly_type": {
            "type": "keyword"
        }
    }
}

* latest_telemetry

"geolocation.location": {
    "type": "geo_point"
},
"sendtimestamp": {
    "type": "date",
    "format": "date_optional_time"
},
"devices": {
    "type": "nested",
    "properties": {
        "deviceid": {
            "type": "keyword"
        },
        "softwareversion": {
            "type": "keyword"
        }
    }
},
"trouble_codes": {
    "type": "nested",
    "properties": {
        "code": {
            "type": "keyword"
        }
    }
},
"anomalies": {
    "type": "nested",
    "properties": {
        "anomaly_type": {
            "type": "keyword"
        }
    }
}

* trip / event / anomaly / dtc

"sendtimestamp": {
    "type": "date",
    "format": "date_optional_time"
}
```


### Notes

If you require the use of Kibana (https://aws.amazon.com/elasticsearch-service/the-elk-stack/kibana/) there will need to be some additions to Cognito and Elasticsearch. See instructions here: https://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/es-cognito-auth.html


**Current Issues**
```
* OTA
Status: as of (05/11/2020), creation of a job cannot use the, "year" as a request parameter.

Example:
{
    "desiredVersion": "2.9",
    "filters": {
        "troubleCodes": [],
        "vehicle": {
        "vin": [],
        "make": [],
        "model": [],
        "year": [2015]
        },
        "software": {
        "swVersion": ""
        }
    }
}
```

**Caveat**

OTA job maybe not display complete on the UI if:
```
1. different sets of provisioned vehicles, but 1 simulation running for specific set
2. mismatch of vehicles in CDF Asset Library and Elasticsearch index (shared_cardata)
```



## Local Deployment

In order for a developer to make any modifications to this application, they will need to:

* make sure all application dependencies are present on local machine
```
List of dependencies:

* AWS CLI (used for interacting with cloudformation)
* AWS Chalice (application is built using this framework)
* AWS Account User (Security Credentials Tab) HTTPS Git credentials for AWS CodeCommit
* Python (3.6+)
* Python virtualenv
* Software IDE (Visual Studio Code)

* Note: all other python libraries viewable in 2 locations:
  1. requirements.txt (root)
  2. python.zip (pure_lambdas/zipped)
```

### Steps (terminal commands)

**Create a folder on local machine which will house your virtual environment necessary to run application dependencies**

What is virtualenv?

It creates an environment that has its own installation directories, that doesn’t share libraries with other virtualenv environments (and optionally doesn’t access the globally installed libraries either).

    Once you have virtualenv installed (pip install virtualenv), create a main virtual environment directory:
    * mkdir Environments
    * cd Enviroments
    * virtualenv <project name associated with this environment>


**Create a new folder on your local machine for application:**

    mkdir <folder name>
    cd <folder>

**Initialize Git:**

    git init

**Clone repo cvra-backend to your local machine:**

    git clone repo <location>

**Activate your virtual environment and install application dependencies into it**

    source Environments/<project specific env>/bin/activate
    pip install -r requirements.txt

**Create your local branch, so that any changes you make to the repo, it will be contained in its own branch (not master)**

    git checkout -b <your branch name>

**When are you ready to push your local branch to the repo:**

    git push -u origin <your branch name>

Once your local branch has been uploaded to the repo, create a pull request and reviewer will compare to the master branch. If acceptable, merge your branch with the master branch.

After the merge has taken place remotely, on your local machine:
```
* checkout master
* delete your local branch that has been successfully merged with the master branch remotely
* pull from the remote master branch into your local master branch
```

Some repo local branch naming conventions:
```
* master
* dev
* feature/
* issue/
* bug/
* hotfix/
```


### Updates to Chalice Application

Any changes to the application code can now be packaged and deployed using the deploy-cfn.bash script. It's important to note, you must have the virtualenv activated in order to use any Chalice related commands. (see step above)
Within the bash script there are required parameters and optional ones. Please review the script to decide which is needed for your use case.

Below are the steps taken from within the script:

1. Zip non-chalice related lambdas (Optional)
```
zip_file_processor.sh

This is necessary because there is a major difference between a, "pure lambda", and one that is Chalice API dependent (chalicelib directory). These pure lambdas have their own dependencies (zipped), which are referenced in the external cloudformation stack (extras.json & non_chalice.json).
```


2. Package and Deploy the cloudformation stack that is related to UI dependencies:
    * Cognito User Pool
    * Cloudfront Distribution
    * S3 Bucket Housing UI Build

Package Cloudformation stack with non-chalice resources. This step is done at this point to fetch the AWS Cognito User Pool Arn that is used for all API authorizers.

```
aws cloudformation package \
  --template-file non_chalice.json \
  --s3-bucket $BUCKET_NAME \
  --output-template-file out/sam-packaged.yaml


aws cloudformation deploy \
  --template-file out/ui-sam-packaged.yaml \
  --s3-bucket $BUCKET_NAME \
  --stack-name $NON_CHALICE_STACK_NAME \
  --parameter-overrides \
      AdministratorEmail="$USER_POOL_ADMIN_EMAIL" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset \
  $AWS_ARGS
```

3. Fetch the Cognito User Pool Arn from the previous step
```
COGNITO_USER_POOL_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query "Stacks[0].Outputs[?OutputKey=='CDFAutoUserPoolArn'].OutputValue" \
  --output text)
```

4. Package Chalice resources & merge with non-chalice stack (Optional)
```
chalice package --merge-template extras.json out
```

5. Package the merged stack of Chalice and Non-Chalice resources
```
aws cloudformation package \
  --template-file out/sam.json \
  --s3-bucket $BUCKET_NAME \
  --output-template-file out/sam-packaged.yaml
```

6. The final step is deploy the backend Cloudformation stack
```
aws cloudformation deploy \
  $AWS_ARGS \
  --template-file out/sam-packaged.yaml \
  --s3-bucket $BUCKET_NAME \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    VehicleAnomalyTableStreamArn="$DDB_TABLE_STREAM_ARN" \
    CDFCommandsUrl="$CDF_COMMANDS_URL" \
    CDFAssetLibraryUrl="$CDF_ASSET_LIBRARY_URL" \
    EnvironmentName="$ENV_VAR" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset
```
