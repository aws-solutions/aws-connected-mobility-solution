# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Lambda that ingests data from IoT rule for Trip topic:
    dt/cvra/+/trip --> elasticsearch."""
import base64
from cdf_auto_fleetmanager_util import CDFAutoUtils
from marshmallow import ValidationError
from trip_validator import TripSchema
from trip_service import TripService
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
            TripSchema().load(data)
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
                
        TripService.post_trip(validated_objs)


def lambda_handler(event, context):
    """Handler for IoT trip rule data"""

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
