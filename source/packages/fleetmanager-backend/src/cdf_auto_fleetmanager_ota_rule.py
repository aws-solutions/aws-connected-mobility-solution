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
"""Lambda that ingests data from IoT rule for OTA topic:
    - if success status, update cardata/latest_telemetry with latest swv
"""

import os
import json
import boto3
import requests
import time
from requests_aws4auth import AWS4Auth
from cdf_auto_fleetmanager_data_key_cleaner import lowercase
from marshmallow import ValidationError
from ota_rule_validator import OtaSchema
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

REGION = os.getenv('REGION')
CREDENTIALS = boto3.Session().get_credentials()
AWSAUTH = AWS4Auth(CREDENTIALS.access_key, CREDENTIALS.secret_key, REGION, 'es', session_token=CREDENTIALS.token)
HEADERS = {"Content-Type": "application/json"}
HOST = os.getenv('ES_ENDPOINT')
CLIENT = boto3.client('iot')
UPDATE_INDEX_LIST = ['shared_cardata', 'latest_telemetry', 'cardata']


# Util
def convert_str(data):
    for key, value in data.items():
        data[key] = str(value)
    return data


def get_vin(device_id):
    """GET vin from elasticsearch index via incoming device_id"""
    logger.info("Entering get_vin: %s", device_id)

    url = HOST + 'shared_cardata/_search'

    try:
        query = {
            "size": 10000,
            "_source": "vin",
            "query": {
              "bool": {
                "filter": {
                    "nested": {
                        "path": "devices",
                        "query": {
                            "term":
                              {
                                "devices.deviceid": device_id
                              }

                        }
                    }
                }
              }
            }
          }

        es_response = requests.get(url, auth=AWSAUTH, headers=HEADERS, data=json.dumps(query))
        json_response = json.loads(es_response.text)
        logger.info("Vin response: %s", json_response)
    except Exception as err:
        logger.error("Vin response: %s", err)

    else:

        if 'hits' in json_response.keys():
            if len(json_response['hits']['hits']):
                return json_response['hits']['hits'][0]['_source']['vin']

        return False


def get_software_version(job_id):
    """get the software version for the job_id
    from jobs document"""
    logger.info("Entering get_software_version: %s", job_id)

    try:
        job_devices_response = CLIENT.get_job_document(
            jobId=job_id
        )
        logger.info(job_devices_response)

        doc = json.loads(job_devices_response['document'])
        software_version = doc['desiredVersion']

        return software_version

    except Exception as err:
        logger.error("get_software_version", err)

    return False


def update_cardata(sw_version, vin, device_id):
    """update sw version in shared data obj (per vin) in elasticsearch
    This will need to be updated in another version. Will only update the
    1st object in the devices list for a vehicle, where there is potential
    for a vehicle to have multiple devices/software versions in the future."""
    logger.info("Entering update_static_data: %s", sw_version)

    update_list = ['shared_cardata', 'cardata']

    for index in update_list:

        url = HOST + index+'/_update_by_query'

        query = {
            "script": {
                "source": "def targets = ctx._source.devices.findAll(device -> device.deviceid == params.current_deviceid); for(device in targets) { device.softwareversion = params.softwareversion }",
                "params": {
                    "softwareversion": sw_version,
                    "current_deviceid": device_id
                }
            },
            "query": {
                "query_string": {
                    "query": vin
                    }
                }
        }

        try:
            es_response = requests.post(url, auth=AWSAUTH, headers=HEADERS, data=json.dumps(query))
            logger.info("Updated sw version cardata: %s", es_response.text)
        except Exception as err:
            logger.error("Updating sw version cardata: %s", err)


def lambda_handler(event, context):
    """Handler for IoT OTA rule"""

    # 1st convert all data keys to lowercase for consistency
    str_payload = convert_str(event)
    updated_data = lowercase(str_payload)
    logger.info("Incoming OTA payload: %s", updated_data)

    try:
        OtaSchema().load(updated_data)

        if event['status'] == 'SUCCEEDED':
            logger.info("Successful OTA...")

            device_id = event['thingArn'].split('/')[-1].lower()

            # get vin from device_id in elasticsearch
            vin_response = get_vin(device_id)

            if vin_response:

                # get latest software version to update indexes
                swv_response = get_software_version(updated_data['jobid'])

                if swv_response:
                    update_cardata(swv_response, vin_response, device_id)

    except ValidationError as err:
        logger.error(err.messages)
