# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Lambda that ingests data from IoT rule for OTA topic:
    - if success status, update cardata/latest_telemetry with latest swv
"""

import json
import boto3
from cdf_auto_fleetmanager_util import CDFAutoUtils
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

CLIENT = boto3.client('iot')
UPDATE_INDEX_LIST = ['shared_cardata', 'cardata']


class OtaService:

    @staticmethod
    def get_vin(device_id):
        """GET vin from elasticsearch index via incoming device_id"""
        logger.info("Entering get_vin: %s", device_id)

        url = CDFAutoUtils.url_builder('shared_cardata', '_search')
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
        logger.info("Final url: {} and query: {}".format(url, query))

        es_response = CDFAutoUtils.es_request(url, query)
        json_response = json.loads(es_response.text)
        logger.info("vin request response: {}".format(json_response))

        if 'hits' in json_response.keys():
            if len(json_response['hits']['hits']):
                return json_response['hits']['hits'][0]['_source']['vin']

        return False

    @staticmethod
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
            logger.error("get_software_version: {}".format(err))

    @staticmethod
    def update_cardata(sw_version, vin, device_id):
        """update sw version in shared data obj (per vin) in elasticsearch
        This will need to be updated in another version. Will only update the
        1st object in the devices list for a vehicle, where there is potential
        for a vehicle to have multiple devices/software versions in the future."""
        logger.info("Entering update_static_data: %s", sw_version)

        for index in UPDATE_INDEX_LIST:

            url = CDFAutoUtils.url_builder(index, '_update_by_query')

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

            CDFAutoUtils.es_add_update(url, query)
