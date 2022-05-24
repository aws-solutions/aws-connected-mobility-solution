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
"""Ingest data from IoT rule for Groups topic:
    cdf/assetlibrary/events/groups/# --> elasticsearch."""

import os
import json
import boto3
import requests
import time
from marshmallow import ValidationError
from groups_events_validator import GroupSchema
from requests_aws4auth import AWS4Auth
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


class StaticCarData:
    """class to map incoming mqtt group event (static car data) with
    device information (deviceId & software version) and PUT in
    elasticsearch index shared_cardata"""

    def __init__(self):
        self.device_software_version = ''
        self.device_id = ''
        self.vin = ''
        self.static_data = dict()

    def es_request(self):
        """POST data into elasticsearch index"""
        logger.info("Entering es_request")

        url = HOST + 'shared_cardata/_doc'

        try:
            es_response = requests.post(url, auth=AWSAUTH, json=self.static_data)
            logger.info("Successfully sent shared car data to ES: %s", es_response.text)
        except Exception as err:
            logger.error("Elasticsearch: %s", err)

    def get_device_data(self):
        """Elasticsearch: device data -> deviceId (per vin) and softwareversion (per deviceId)
        A.
            {
                "_index" : "devices",
                "_type" : "_doc",
                "_id" : "TNkUsG4BasvSf8_YQ8Wv",
                "_score" : 1.0,
                "_source" : {
                "attributes" : {
                    "status" : "installed",
                    "softwareVersion" : "2.3"
                },
                "groups" : { },
                "devices" : { },
                "deviceId" : "ecu-aws-2014-umyi8trclr",
                "category" : "device",
                "templateId" : "auto_ecu"
                }
            }
        B.
            {
                "_index" : "devices",
                "_type" : "_doc",
                "_id" : "P9kUsG4BasvSf8_YQsWr",
                "_score" : 1.0,
                "_source" : {
                "deviceId" : "ecu-aws-2014-umyi8trclr",
                "vin" : "5azgv24bxfd10020"
                }
            }
        """
        logger.info("Entering get_device_data")

        # delay for 3 secs, since this group mqtt message is published at
        # the same time as the device even topic that contains software version
        logger.info("sleep for 3 secs")
        time.sleep(3)

        url = HOST + 'devices/_search'

        # query for device doc B
        query_device_id = {
            "size": 1,
            "query": {
                  "term": {
                    "vin.keyword": self.vin
                  }
              }
          }

        try:
            device_response = requests.get(url, auth=AWSAUTH, headers=HEADERS, data=json.dumps(query_device_id))
        except Exception as err:
            logger.error("Elasticsearch devices device_id request: %s", err)
        else:
            device_id_response = json.loads(device_response.text)

            if 'hits' in device_id_response:

                if len(device_id_response['hits']['hits']):
                    self.device_id = device_id_response['hits']['hits'][0]['_source']['deviceid']

                    # now we have the device_id, query for the softwareVersion
                    query_sv = {
                        "size": 2,
                        "query": {
                            "bool": {
                                        "filter": {"term": {"deviceid.keyword": self.device_id}}
                                    }
                            }
                    }

                    try:
                        software_response = requests.get(url, auth=AWSAUTH, headers=HEADERS, data=json.dumps(query_sv))
                    except Exception as err:
                        logger.error("Elasticsearch device software version request: %s", err)
                    else:
                        software_data = json.loads(software_response.text)

                        if len(software_data['hits']['hits']):
                            # potential in the future for vehicle to have multiple devices
                            # for now chooses 1
                            for obj in software_data['hits']['hits']:
                                if 'softwareversion' in obj['_source'].keys():
                                    self.device_software_version = obj['_source']['softwareversion']

        # add device info to static_data (even if blank)
        self.static_data['devices'] = [
            {'deviceid':  self.device_id, 'softwareversion': self.device_software_version}
        ]

        self.es_request()

    def incoming_message_parser(self, message):
        """Parse the incoming cdf group data."""

        logger.info("Entering incoming_message_parser")

        if 'payload' in message.keys():

            # decode payload
            payload = json.loads(message['payload'])
            # lowercase encoded payload keys
            cleaned = lowercase(payload)
            # validate payload now that data is processed
            try:
                GroupSchema().load(cleaned)
                temp_dict = dict()

                if 'make' in cleaned['attributes'].keys():
                    cleaned['vin'] = cleaned.pop('name')
                    self.static_data = cleaned
                    self.vin = cleaned['vin'].lower()

            except ValidationError as err:
                logger.error(err.messages)


def lambda_handler(event, context):
    """Handler for IoT cardata rule telemetry"""

    # 1st convert all data keys to lowercase for consistency (not encoded data)
    updated_data = lowercase(event)

    process_event = StaticCarData()
    process_event.incoming_message_parser(updated_data)

    if process_event.static_data:
        process_event.get_device_data()
