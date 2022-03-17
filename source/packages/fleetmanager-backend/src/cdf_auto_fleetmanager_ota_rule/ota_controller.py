# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Lambda that ingests data from IoT rule for OTA topic:
    - if success status, update cardata/latest_telemetry with latest swv
"""
import base64
from cdf_auto_fleetmanager_util import CDFAutoUtils
from marshmallow import ValidationError
from ota_validator import OtaSchema
from ota_service import OtaService
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
    def convert_str(data):
        for key, value in data.items():
            data[key] = str(value)
        return data

    @staticmethod
    def validator(data):
        """validate each payload in the list."""
        logger.info("Entering validator")

        try:
            OtaSchema().load(data)
            return True
        except ValidationError as err:
            logger.error("Data validation error: {}".format(err))

    @staticmethod
    def process_data_list(data_list):
        """iterate through incoming list of groups (kinesis stream)"""

        for data in data_list:
            # convert incoming ts to string
            updated_data = MessageProcessor.convert_str(data)

            validate = MessageProcessor.validator(updated_data)

            if validate:
                logger.info("Data validated")

                if updated_data['status'] == 'SUCCEEDED':
                    logger.info("Successful OTA...")

                    device_id = updated_data['thingarn'].split('/')[-1].lower()

                    # get vin from device_id in elasticsearch
                    vin_response = OtaService.get_vin(device_id)

                    if vin_response:

                        # get latest software version to update indexes
                        swv_response = OtaService.get_software_version(updated_data['jobid'])

                        if swv_response:
                            OtaService.update_cardata(swv_response, vin_response, device_id)


def lambda_handler(event, context):
    """Handler for IoT OTA rule"""

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
