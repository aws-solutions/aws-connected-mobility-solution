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
"""Lambda that ingests data from IoT rule in relation with cardata telemetry
from the topic dt/cvra/+/cardata. This telemetry is mapped with location
coordinates set up for polygon search mapping in elasticsearch.

The 2nd part to this is adding only the latest telemetry to index:
latest_telemetry. This index will be used for latest geo-coordinate queries.

Validation for incoming data.
"""

import os
import collections
import json
import boto3
import requests
from requests_aws4auth import AWS4Auth
from cdf_auto_fleetmanager_data_key_cleaner import lowercase
from marshmallow import ValidationError, INCLUDE
from telemetry_rule_validator import TelemetrySchema
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


class LatestTelemetry:
    """PUT incoming data into the
    latest_telemetry es index, where only
    the latest (1) document (vin) will live.
    _id = vin
    """
    @staticmethod
    def add_to_latest_telemetry_index(payload):
        """add new payload to the latest_telemetry index"""

        logger.info("Entering add_to_latest_telemetry_index")

        url = HOST + 'latest_telemetry/_doc/' + payload['vin']

        try:
            es_response = requests.post(url, auth=AWSAUTH, headers=HEADERS, json=payload)
            logger.info("Add to latest_telemetry: %s", es_response.text)
        except Exception as err:
            logger.error("Add to latest_telemetry: %s", err)


class Telemetry:
    """cardata index houses all incoming telemetry via
    IoT rule"""

    @staticmethod
    def flatten_dict(message, parent_key='', sep='.'):
        """Flatten out incoming dictionary"""
        logger.info("Entering flatten: %s", message)

        items = []
        for message_key, message_value in message.items():
            new_key = parent_key + sep + message_key if parent_key else message_key
            if isinstance(message_value, collections.MutableMapping):
                items.extend(Telemetry.flatten_dict(message_value, new_key, sep=sep).items())
            else:
                items.append((new_key, message_value))
        return dict(items)

    @staticmethod
    def add_to_cardata_index(payload):
        """POST data into elasticsearch index"""
        logger.info("Entering add_to_cardata_index: %s", payload)

        url = HOST + 'cardata/_doc/'

        try:
            es_response = requests.post(url, auth=AWSAUTH, headers=HEADERS, json=payload)
            logger.info("Add to cardata index: %s", es_response.text)
        except Exception as err:
            logger.error("Add to cardata index: %s", err)

    @staticmethod
    def get_shared_data(vin):
        """GET shared_cardata from elasticsearch index per vin"""
        logger.info("Entering get_shared_data with vin: %s", vin)

        url = HOST + 'shared_cardata/_search'

        query = {
            "query": {
                "term": {
                    "vin.keyword": vin
                }
            }
        }

        try:
            es_response = requests.get(url, auth=AWSAUTH, headers=HEADERS, data=json.dumps(query))
            return json.loads(es_response.text)
        except Exception as err:
            logger.error("Request for shared cardata: %s", err)
            return False

    @staticmethod
    def incoming_message_parser(message):
        """Parse the incoming cardata and add:
        - location key/value to the object list [lon, lat]
        - devices data (deviceId & software version)
        """

        logger.info("Entering incoming_message_parser")

        # flatted the nested json object to find lat/lon
        flattened_response = Telemetry.flatten_dict(message)

        temp_dict = dict()

        for key, value in flattened_response.items():
            if 'latitude' in key:
                temp_dict['lat'] = float(value)

            if 'longitude' in key:
                temp_dict['lon'] = float(value)

        final_coordinates = [temp_dict['lon'], temp_dict['lat']]

        message['geolocation']['location'] = final_coordinates

        # add static data here
        shared_data_response = Telemetry.get_shared_data(message['vin'])
        logger.info("Shared data response: %s", shared_data_response)

        if shared_data_response and len(shared_data_response['hits']['hits']):
            message['attributes'] = shared_data_response['hits']['hits'][0]['_source']['attributes']

            if 'devices' in shared_data_response['hits']['hits'][0]['_source'].keys():
                message['devices'] = shared_data_response['hits']['hits'][0]['_source']['devices']

            if 'trouble_codes' in shared_data_response['hits']['hits'][0]['_source'].keys():
                message['trouble_codes'] = shared_data_response['hits']['hits'][0]['_source']['trouble_codes']

            if 'anomalies' in shared_data_response['hits']['hits'][0]['_source'].keys():
                message['anomalies'] = shared_data_response['hits']['hits'][0]['_source']['anomalies']

        # send payload to latest_telemetry index
        latest_telemetry = LatestTelemetry()
        latest_telemetry.add_to_latest_telemetry_index(message)

        # send payload to cardata index
        Telemetry.add_to_cardata_index(message)


def lambda_handler(event, context):
    """Handler for IoT cardata rule telemetry

        latest_telemetry: index for housing only the latest
        documents. Used for geoPoint coordinate queries

        cardata: index that houses all documents. Used for
        individual vehicle queries (route calculations)
    """
    # convert all data keys to lowercase for consistency
    updated_data = lowercase(event)

    try:
        TelemetrySchema().load(updated_data, unknown=INCLUDE)

        # 1st: send incoming data message to be parsed & map location/coord
        # 2nd: post data to elasticsearch indexes (latest_telemetry & cardata)
        cardata_index = Telemetry()
        cardata_index.incoming_message_parser(updated_data)

    except ValidationError as err:
        logger.error(err.messages)
