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
from misc_telemetry_validator import TelemetrySchema
from misc_telemetry_service import TelemetryService
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
                validated_objs.append(data)

        # send payloads to latest_telemetry index
        TelemetryService.add_to_latest_telemetry_index(validated_objs)

        # send payloads to cardata index
        TelemetryService.add_to_cardata_index(validated_objs)


def lambda_handler(event, context):
    """Handler for IoT electric and tire info telemetry rule

        latest_telemetry: index for housing only the latest
        documents.

        cardata: index that houses all documents. Used for
        calculating values from current / older data
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