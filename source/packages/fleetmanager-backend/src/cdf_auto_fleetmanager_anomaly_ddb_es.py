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
"""DDB table enntry trigger:
- anomaly data from DDB table --> this lambda --> elasticsearch"""

import os
import json
import boto3
import requests
from requests_aws4auth import AWS4Auth
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
    """POST data into elasticsearch index"""
    logger.info("Entering add_shared_cardata_index")

    url = HOST + 'shared_cardata/_update_by_query'

    query = {
        "script": {
            "source": "ctx._source.anomalies = [params.anomaly]",
            "params": {
                "anomaly": payload
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


def add_anomaly_index(payload):
    """Adding dtc object to elasticsearch index"""
    logger.info("Entering add_anomaly_index")

    url = HOST + 'anomaly/_doc'

    try:
        es_response = requests.post(url, auth=AWSAUTH, json=payload)
        logger.info("Add to anomaly: %s", es_response.text)
    except Exception as err:
        logger.error("Add to anomaly: %s", err)


def ddb_message(ddb_message):
    """Take in latest DDB message from stream to be sent to
    elasticsearch.
    {
          "anomaly_id" : "S019VT46E",
          "anomaly_score" : "45.827756308918936",
          "anomaly_type" : "OilTemp",
          "created_at" : "2020-04-21T18:12:53Z",
          "identified_at" : "2020-04-21T18:12:50Z",
          "pk" : "5AZYG67LX9B10001",
          "sk" : "A:OilTemp",
          "updated_at" : "2020-04-21T18:12:53Z",
          "value" : "295.82775630891894",
          "vin" : "5AZYG67LX9B10001",
          "deletion_flag" : "1587492774"
        }
    """
    new_anomaly_obj = dict()
    vehicle_vin = ''

    for record in ddb_message['Records']:
        logger.info("Incoming DDB record: %s", record)

        if record['eventName'] == 'INSERT':

            vehicle_vin = record['dynamodb']['NewImage']['vin']['S']

            new_anomaly_obj = {
                "anomaly_id": record['dynamodb']['NewImage']['anomaly_id']['S'],
                "anomaly_score": record['dynamodb']['NewImage']['anomaly_score']['N'],
                "anomaly_type": record['dynamodb']['NewImage']['anomaly_type']['S'],
                "created_at": record['dynamodb']['NewImage']['created_at']['S'],
                "identified_at": record['dynamodb']['NewImage']['identified_at']['S'],
                "pk": record['dynamodb']['NewImage']['pk']['S'],
                "sk": record['dynamodb']['NewImage']['sk']['S'],
                "updated_at": record['dynamodb']['NewImage']['updated_at']['S'],
                "value": record['dynamodb']['NewImage']['value']['N'],
            }

    return (vehicle_vin, new_anomaly_obj)


def lambda_handler(event, context):
    """Handler for DDB trigger -> anomaly data

        Write anomaly to elasticsearch indexes
        1. shared_cardata index: UI data
        2. dtc index: historical
    """

    # send incoming data message to be parsed
    ddb_response = ddb_message(event)

    # send final data object to elasticsearch
    if ddb_response[0]:
        add_shared_cardata_index(ddb_response[0], ddb_response[1])
        add_anomaly_index(ddb_response[1])
