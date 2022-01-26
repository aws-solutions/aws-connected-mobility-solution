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
"""Lambda that ingests data from IoT rule for Event topic:
    dt/cvra/+/event --> elasticsearch."""

import os
import json
import boto3
import requests
from requests_aws4auth import AWS4Auth
from cdf_auto_fleetmanager_data_key_cleaner import lowercase
from marshmallow import ValidationError
from event_rule_validator import EventSchema
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
    logger.info("Entering es_request for event data")

    url = HOST + 'event/_doc'

    try:
        es_response = requests.post(url, auth=AWSAUTH, json=payload)
        logger.info("Add to event: %s", es_response.text)
    except Exception as err:
        logger.error("Add to event: %s", err)


def lambda_handler(event, context):
    """Handler for IoT event rule data"""

    # convert all data keys to lowercase for consistency
    updated_data = lowercase(event)

    try:
        # validate attributes
        EventSchema().load(updated_data)

        # send final data object to elasticsearch
        es_request(updated_data)

    except ValidationError as err:
        logger.error(err.messages)
