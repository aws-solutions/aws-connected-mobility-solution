# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Lambda that ingests data from IoT rule telemetry
from the topic dt/cvra/+/cardata. This telemetry is mapped with location
coordinates set up for polygon search mapping in elasticsearch.

The 2nd part = adding only the latest telemetry to index:
latest_telemetry. This index will be used for latest geo-coordinate queries.
"""

import base64
import collections
from cdf_auto_fleetmanager_util import CDFAutoUtils
from marshmallow import ValidationError
from telemetry_validator import TelemetrySchema
from telemetry_service import TelemetryService
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class MessageProcessor:
    """handle incoming event message per type of group"""

    @staticmethod
    def flatten_dict(message, parent_key='', sep='.'):
        """Flatten out incoming dictionary"""

        items = []
        for message_key, message_value in message.items():
            new_key = parent_key + sep + message_key if parent_key else message_key
            if isinstance(message_value, collections.MutableMapping):
                items.extend(MessageProcessor.flatten_dict(message_value, new_key, sep=sep).items())
            else:
                items.append((new_key, message_value))
        return dict(items)

    @staticmethod
    def validator(data):
        """validate each payload in the list."""
        logger.info("Entering validator")

        try:
            TelemetrySchema().load(data)
            return True
        except ValidationError as err:
            logger.error("Data validation error: {}".format(err))

    @staticmethod
    def process_data_list(data_list):
        """iterate through incoming list of groups (kinesis stream)"""

        validated_objs = list()

        for data in data_list:

            validate = MessageProcessor.validator(data)

            if validate:
                complete_data = MessageProcessor.data_mapper(data)
                validated_objs.append(complete_data)

        # send payload to latest_telemetry index
        TelemetryService.add_to_latest_telemetry_index(validated_objs)

        # send payload to cardata index
        TelemetryService.add_to_cardata_index(validated_objs)

    @staticmethod
    def data_mapper(data):
        """Parse the incoming cardata and add:
        - location key/value to the object list [lon, lat]
        - shared_cardata:
            - vehicle attributes
            - device(s) data
            -+ dtc
            -+ anomaly
        """

        logger.info("Entering data_mapper")

        # flatted the nested json object to find lat/lon
        flattened_response = MessageProcessor.flatten_dict(data)

        temp_dict = dict()

        for key, value in flattened_response.items():
            if 'latitude' in key:
                temp_dict['lat'] = float(value)

            if 'longitude' in key:
                temp_dict['lon'] = float(value)

        final_coordinates = [temp_dict['lon'], temp_dict['lat']]

        data['geolocation']['location'] = final_coordinates

        # add static data here
        shared_data_response = TelemetryService.get_shared_data(data['vin'])
        logger.info("Shared data response: %s", shared_data_response)

        if shared_data_response and len(shared_data_response['hits']['hits']):
            data['attributes'] = shared_data_response['hits']['hits'][0]['_source']['attributes']

            if 'devices' in shared_data_response['hits']['hits'][0]['_source'].keys():
                data['devices'] = shared_data_response['hits']['hits'][0]['_source']['devices']

            if 'trouble_codes' in shared_data_response['hits']['hits'][0]['_source'].keys():
                data['trouble_codes'] = shared_data_response['hits']['hits'][0]['_source']['trouble_codes']

            if 'anomalies' in shared_data_response['hits']['hits'][0]['_source'].keys():
                data['anomalies'] = shared_data_response['hits']['hits'][0]['_source']['anomalies']

            if 'service_set' in shared_data_response['hits']['hits'][0]['_source'].keys():
                data['service_set'] = shared_data_response['hits']['hits'][0]['_source']['service_set']

            if 'service_status' in shared_data_response['hits']['hits'][0]['_source'].keys():
                data['service_status'] = shared_data_response['hits']['hits'][0]['_source']['service_status']

        logger.info("Mapped data: {}".format(data))
        return data


def lambda_handler(event, context):
    """Handler for IoT cardata rule telemetry

        latest_telemetry: index for housing only the latest
        documents. Used for geoPoint coordinate queries

        cardata: index that houses all documents. Used for
        individual vehicle queries (route calculations)
    """

    # store incoming event decrypted data
    temp_data = list()

    try:
        for record in event['Records']:
            payload = base64.b64decode(record["kinesis"]["data"])
            temp_data.append(payload)

        # convert objs to json
        normal_data = CDFAutoUtils.kinesis_stream_data_converter(temp_data)

        # convert all keys lowercase
        updated_data = CDFAutoUtils.uniform_keys(normal_data)

        # evaluate the data list
        MessageProcessor.process_data_list(updated_data)

    except Exception as err:
        logger.error("General error: {}".format(err))
