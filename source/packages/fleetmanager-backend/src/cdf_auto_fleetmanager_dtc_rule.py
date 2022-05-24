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
"""Lambda that ingests data from IoT rule for DTC topic:
    dt/cvra/+/dtc --> elasticsearch."""

import os
import json
import boto3
import requests
from requests_aws4auth import AWS4Auth
from cdf_auto_fleetmanager_data_key_cleaner import lowercase
from marshmallow import ValidationError
from dtc_rule_validator import DtcSchema
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


def add_shared_cardata_index(vin, payload):
    """POST data into elasticsearch indexes:
    shared_cardata -> pulled from published telemetry"""

    logger.info("Entering add_shared_cardata_index")

    url = HOST + 'shared_cardata/_update_by_query'

    query = {
        "script": {
            "source": "ctx._source.trouble_codes = [params.dtc]",
            "params": {
                "dtc": payload
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
        logger.info("Add to shared_cardata: %s", es_response.text)
    except Exception as err:
        logger.error("Add to shared_cardata: %s", err)


def add_dtc_index(payload):
    """Adding dtc object to elasticsearch index"""
    logger.info("Entering add_dtc_index")

    url = HOST + 'dtc/_doc'

    try:
        es_response = requests.post(url, auth=AWSAUTH, json=payload)
        logger.info("Add to dtc: %s", es_response.text)
    except Exception as err:
        logger.error("Add to dtc: %s", err)


def lambda_handler(event, context):
    """Handler for IoT dtc rule data
    {
          "messageid" : "1AZVT16XXEE10005-2020-04-22T22:21:26.229Z",
          "creationtimestamp" : "2020-04-22T22:21:26.229Z",
          "sendtimestamp" : "2020-04-22T22:21:26.229Z",
          "vin" : "1AZVT16XXEE10005",
          "dtc" : {
            "code" : "P1734",
            "changed" : "true"
          }
        }
        Write dtc to elasticsearch indexes
        1. shared_cardata index: UI data
        2. dtc index: historical
    """

    # convert all data keys to lowercase for consistency
    updated_data = lowercase(event)

    try:
        # validate attributes
        DtcSchema().load(updated_data)

        add_shared_cardata_index(updated_data['vin'], updated_data['dtc'])
        add_dtc_index(updated_data)

    except ValidationError as err:
        logger.error(err.messages)
