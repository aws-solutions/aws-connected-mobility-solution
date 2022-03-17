# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Lambda that ingests data from IoT rule for Device topic:
    cdf/assetlibrary/events/devices/# --> elasticsearch.
    Use incoming device ID to fetch all data for device from
    CDF Asset Library to map with VIN and write to ES indexes
    (shared_cardata)"""

import os
import json
import urllib.parse
from cdf_auto_fleetmanager_util import CDFAutoUtils
import lambda_invoke as _lambda
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

HEADERS = {"Content-Type": "application/json"}
ASSET_HEADERS = {
    'Content-Type': 'application/vnd.aws-cdf-v2.0+json',
    'Accept': 'application/vnd.aws-cdf-v2.0+json'
}
ASSET_LIBRARY_FUNCTION_NAME = os.getenv('ASSET_LIBRARY_FUNCTION_NAME')


class SensorService:

    @staticmethod
    def _build_device_add_query(vin, payload):
        """build elasicsearch query specific
        for adding a sensor device"""

        logger.info("Entering build_device_add_query")

        query = {
            "script": {
                "lang": "painless",
                "source": "if(ctx._source.devices == null) {ctx._source['devices'] = [params.object]}else{ctx._source['devices'].add(params.object)}",
                "params": {
                    "object": payload
                }
            },
            "query": {
                "query_string": {
                    "query": vin
                }
            }
        }

        return query

    @staticmethod
    def _build_device_delete_query(vin, payload):
        """build elasicsearch query specific
        for removing a device sensor."""

        logger.info("Entering build_device_add_query")

        query = {
            "script": {
                "lang": "painless",
                "source": "ctx._source.devices.removeIf(list_item -> list_item.deviceid == params.remove_id);",
                "params": {
                    "remove_id": payload['deviceid']
                }
            },
            "query": {
                "query_string": {
                    "query": vin
                }
            }
        }

        return query

    @staticmethod
    def add_new_sensor(vin, payload):
        logger.info("Entering add_new_sensor")

        url = CDFAutoUtils.url_builder('shared_cardata', '_update_by_query?conflicts=proceed&refresh=true')
        query = SensorService._build_device_add_query(vin, payload)
        logger.info("Final url: {} and query: {}".format(url, query))

        CDFAutoUtils.es_add_update(url, query)

    @staticmethod
    def remove_sensor(vin, payload):
        logger.info("Entering remove_sensor")

        url = CDFAutoUtils.url_builder('shared_cardata', '_update_by_query?conflicts=proceed&refresh=true')
        query = SensorService._build_device_delete_query(vin, payload)
        logger.info("Final url: {} and query: {}".format(url, query))

        CDFAutoUtils.es_add_update(url, query)

    @staticmethod
    def update_sensor(vin, payload):
        """updating sensor in a list of devices means
        removing the existing (per deviceid) and adding
        the new version to the list"""
        logger.info("Entering update_sensor")

        # 1st remove current sensor from device list
        logger.info("1st remove existing sensor data...")
        SensorService.remove_sensor(vin, payload)

        # 2nd add new sensor payload to device list
        logger.info("2nd add the updated sensor data...")
        SensorService.add_new_sensor(vin, payload)


class TCUService:

    @staticmethod
    def add_new_tcu(payload):
        """incoming data -> ES index devices"""
        logger.info("Entering es_request")

        CDFAutoUtils.es_bulk(payload, 'shared_cardata')

    @staticmethod
    def cdf_device_data(device_id):
        """comprehensive device data from cdf asset library
        {
            "attributes": {
                "model": "TCU-2",
                "type": "tcu",
                "softwareVersion": "1.7",
                "status": "installed"
            },
            "groups": {
                "installed_in": [
                    "/auto/vehicles/1azir78cxka10000"
                ],
                "manufactured_by": [
                    "/auto/suppliers/aufderhar, kling and rowe"
                ]
            },
            "category": "device",
            "templateId": "auto_ecu",
            "awsIotThingArn": "arn:aws:iot:us-west-2:798706540840:thing/ECU-AWS-2017-URLDVB1WSG",
            "state": "active",
            "deviceId": "ecu-aws-2017-urldvb1wsg"
        }
        """
        logger.info("Entering cdf_device_data")

        path = '/devices/' + device_id
        logger.info("query path: {}".format(path))

        try:
            cdf_response = _lambda.invoke(
                function=ASSET_LIBRARY_FUNCTION_NAME,
                path=path,
                method='GET',
                headers=HEADERS,
                queryStringParams=None,
                stageVariables=None,
                requestContext=None,
                body=None
            )

            logger.info("CDF Asset Library Status: %s", cdf_response.get('statusCode'))

            if cdf_response.get('statusCode') == 200:
                return json.loads(cdf_response['body'])

        except Exception as err:
            logger.error("Asset Library Error: {}".format(err))

    @staticmethod
    def cdf_vehicle_data(vin):
        """comprehensive vehicle (cdf: group) data from cdf asset library
        {
            "attributes": {
                "make": "AMZ",
                "modelYear": 2011,
                "bodyType": "Estate",
                "fuelType": "Gas",
                "transmissionType": "Auto",
                "colorCode": "255",
                "iviType": "Premium",
                "dtc": "P1734",
                "model": "2"
            },
            "groups": {
                "owns": [
                    "/auto/users/kirlin_kariane"
                ]
            },
            "category": "group",
            "templateId": "auto_vehicle",
            "name": "1AZRN57EXEE10007",
            "groupPath": "/auto/vehicles/1azrn57exee10007",
            "parentPath": "/auto/vehicles"
        }
        """
        logger.info("Entering cdf_vehicle_data")

        group = '/auto/vehicles/' + vin
        group_encoding = urllib.parse.quote(group, safe='')
        path = '/groups/' + group_encoding

        logger.info("query path: {}".format(path))

        try:
            cdf_response = _lambda.invoke(
                function=ASSET_LIBRARY_FUNCTION_NAME,
                path=path,
                method='GET',
                headers=HEADERS,
                queryStringParams=None,
                stageVariables=None,
                requestContext=None,
                body=None
            )

            logger.info("CDF Asset Library Status: %s", cdf_response.get('statusCode'))

            if cdf_response.get('statusCode') == 200:
                json_data = json.loads(cdf_response['body'])
                final_data = CDFAutoUtils.lowercase(json_data)
                return final_data['attributes']

        except Exception as err:
            logger.error("Asset Library Error: {}".format(err))
