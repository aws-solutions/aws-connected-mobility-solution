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
"""Return all devices for OTA job"""
import os
from datetime import datetime
import boto3
import json
from requests_aws4auth import AWS4Auth
import logging
from elasticsearch import Elasticsearch, RequestsHttpConnection
from chalice import BadRequestError, ChaliceViewError
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

CLIENT = boto3.client('iot')

REGION = os.getenv('REGION')
CREDENTIALS = boto3.Session().get_credentials()
AWSAUTH = AWS4Auth(CREDENTIALS.access_key, CREDENTIALS.secret_key, REGION, 'es', session_token=CREDENTIALS.token)
HEADERS = {"Content-Type": "application/json"}
HOST = os.getenv('ES_ENDPOINT')


# Util
def json_serial(obj):
    if isinstance(obj, (datetime)):
        return obj.timestamp()
    raise ChaliceViewError("Return data error - datetime")


def add_device_id(data):
    for device_obj in data['executionSummaries']:
        device_id = device_obj['thingArn'].split('/')[-1]
        device_obj['deviceId'] = device_id

    return data


def create_es_client():
    logger.info("Entering create_es_client")

    url = HOST.split("//")[-1]

    try:
        es_client = Elasticsearch(
            hosts=[{'host': url, 'port': 443}],
            http_auth=AWSAUTH,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection
        )

        return es_client

    except Exception as err:
        logger.error("Creating ES client: %s", err)
        raise ChaliceViewError(err)


def get_es_data(device_data):
    """Query vehicles from elasticsearch from incoming
    job data to map the vins to each data obj.
    example es query:
    {
    "query": {
            "nested" : {
                "path" : "devices",
                "query" : {
                    "terms" : {
                    "devices.deviceid": ["ecu-aws-2014-ycw9v4_uoq", "ecu-aws-2014-z9pl5ae70u"]
                    }

                }
            }
        }
    }
    """
    logger.info("Entering get_es_data")

    es_client = create_es_client()

    es_query = {
                    "size": 10000,
                    "_source": ["devices"],
                    "query": {
                        "nested": {
                            "path": "devices",
                            "query": {
                                "terms": {
                                    "devices.deviceid": []
                                }

                            }
                        }
                    }
                }

    for device_obj in device_data['executionSummaries']:
        device_id = device_obj['thingArn'].split('/')[-1].lower()
        logger.info("device_id: %s", device_id)
        es_query['query']['nested']['query']['terms']['devices.deviceid'].append(device_id)

    logger.info("Final query: %s", es_query)
    try:
        es_response = es_client.search(index='latest_telemetry', body=es_query)
        logger.info("ES response: %s", es_response)

        if 'hits' in es_response:
            if len(es_response['hits']['hits']):
                return es_response

    except Exception as err:
        logger.error("Searching es: %s", err)
        raise ChaliceViewError(err)

    return False


def map_vins(es_data, device_data):
    """map vins to device_ids"""
    logger.info("Entering map_vins")

    if 'hits' in es_data:
        if len(es_data['hits']['hits']):
            # loop through device data
            for device_obj in device_data['executionSummaries']:
                device_id = device_obj['thingArn'].split('/')[-1].lower()
                logger.info("device_id: %s", device_id)

                device_obj['deviceId'] = device_id.upper()

                # loop through elasticsaerch data
                for es_obj in es_data['hits']['hits']:

                    # could be multiple devices for vin in elasticsearch
                    for es_device_obj in es_obj['_source']['devices']:
                        logger.info("es_device_obj: %s", es_device_obj)

                        if es_device_obj['deviceid'] == device_id:
                            device_obj['vin'] = es_obj['_id']

            return device_data
        else:
            ChaliceViewError("No elasticsearch data to map to device IDs")
    else:
        ChaliceViewError("Elasticsearch error, no response")


def process_job_devices(job_id, token=None):
    logger.info("Entering process_job_devices")

    try:
        job_devices_response = CLIENT.list_job_executions_for_job(
            jobId=job_id,
            maxResults=50,
            nextToken=token
        )
        logger.info("job devices response: %s", job_devices_response)

        del job_devices_response['ResponseMetadata']

        es_response = get_es_data(job_devices_response)

        if es_response:
            mapped_data = map_vins(es_response, job_devices_response)
            return json.dumps(mapped_data, default=json_serial)
        else:
            updated_data = add_device_id(job_devices_response)
            return json.dumps(updated_data, default=json_serial)

    except Exception as err:
        logger.error("Get ota job devices: %s", err)
        raise ChaliceViewError(err)
