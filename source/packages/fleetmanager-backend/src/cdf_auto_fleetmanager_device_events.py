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
"""Lambda that ingests data from IoT rule for Device topic:
    cdf/assetlibrary/events/devices/# --> elasticsearch."""

import os
import json
import boto3
import requests
from requests_aws4auth import AWS4Auth
from marshmallow import ValidationError
from device_events_validator import SoftwareVersionSchema, VinSchema
from cdf_auto_fleetmanager_data_key_cleaner import lowercase
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


def es_request(payload):
    """POST data into elasticsearch index"""
    logger.info("Entering es_request")

    url = HOST + 'devices/_doc'

    try:
        es_response = requests.post(url, auth=AWSAUTH, json=payload)
        logger.info("Adding device: %s", es_response.text)
    except Exception as err:
        logger.error("Adding device: %s", err)


def incoming_message_parser(message):
    """Parse the incoming cdf group data.
    {
        "objectid":"ecu-aws-2014-ybjgqxueqp",
        "type":"devices",
        "event":"modify",
        "payload":{
           "attributes":{
              "status":"installed",
              "softwareVersion":"2.3"
           },
           "groups":{},
           "devices":{},
           "deviceId":"ecu-aws-2014-ybjgqxueqp",
           "category":"device",
           "templateId":"auto_ecu"
        },
        "time":"2020-04-06T18:19:39.890Z"
    }
    OR
    {
        "objectId": "12345",
        "type": "devices",
        "event": "modify",
        "attributes": {
        "deviceId": "ecu-aws-2014-umyi8trclr",
        "attachedToGroup": "/auto/vehicles/1hgbh41jxmn109186",
        "relationship": "installed_in"
        },
        "time": "2019-11-24T02:40:12.543Z"
    }
    """

    logger.info("Entering incoming_message_parser")

    # no need to capture the creation event
    if message['event'] == 'modify':
        logger.info("Incoming device message: %s", message)

        if 'attributes' in message.keys():
            try:
                # validate attributes
                VinSchema().load(message['attributes'])

                if message['attributes']['relationship'] == 'installed_in':
                    temp_dict = dict()
                    vin = message['attributes']['attachedtogroup'].split('/')[3]
                    temp_dict['deviceid'] = message['attributes']['deviceid']
                    temp_dict['vin'] = vin
                    return temp_dict

            except ValidationError as err:
                logger.error(err.messages)

        elif 'payload' in message.keys():
            # decode payload
            payload = json.loads(message['payload'])
            # lowercase encoded payload keys
            cleaned = lowercase(payload)
            # validate payload now that data is processed
            try:
                SoftwareVersionSchema().load(cleaned)
                temp_dict = dict()

                if cleaned['attributes']['status'] == 'installed':
                    temp_dict['softwareversion'] = cleaned['attributes']['softwareversion']
                    temp_dict['deviceid'] = cleaned['deviceid']

                    return temp_dict

            except ValidationError as err:
                logger.error(err.messages)

    return False


def lambda_handler(event, context):
    """Handler for IoT cardata rule telemetry"""

    # 1st convert all data keys to lowercase for consistency
    updated_data = lowercase(event)

    # send incoming data message to be parsed for ES
    parser_response = incoming_message_parser(updated_data)

    if parser_response:

        # send final data object to elasticsearch
        es_request(parser_response)
