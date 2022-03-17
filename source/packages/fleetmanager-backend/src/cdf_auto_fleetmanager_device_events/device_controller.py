# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Lambda that ingests data from IoT rule for Device topic:
    cdf/assetlibrary/events/devices/# --> elasticsearch.
    ES indexes: (shared_cardata)"""

import base64
from marshmallow import ValidationError
from device_validator import SensorDeviceSchema, TCUSchema
from cdf_auto_fleetmanager_util import CDFAutoUtils
from device_service import TCUService, SensorService
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class SensorDeviceData:
    """sensor (non-tcu) devices
    are supplimental and get appended to
    existing vehicle data in Elasticsearch
    index: shared_cardata"""

    @staticmethod
    def get_vin_cdf_group_path(data):
        """return vin from payload string with key, 'groups' that
        has vehicle group path included."""
        logger.info("Entering get_vin_cdf_group_path")

        vin_path = data['payload']['groups']['out']['installed_in'][0]
        vin = vin_path.split('/')[3]

        return vin

    @staticmethod
    def validator(data):
        """validate each payload in the list.
        If specific payload is invalid, it will
        not be included in the data sent to ES."""
        logger.info("Entering validator")

        try:
            SensorDeviceSchema().load(data)
            return True

        except ValidationError as err:
            logger.error("Sensor data validation error: {}".format(err))

    @staticmethod
    def device_processor(data):
        """determine action for incoming cdf device data."""

        logger.info("Entering device_processor: {}".format(data))

        # get vehicle vin from incoming data
        vin = SensorDeviceData.get_vin_cdf_group_path(data)

        # create mapped data
        mapped_data = CDFAutoUtils.nontcu_device_mapper(data)

        if data['event'] == 'create':
            logger.info("Created new sensor")
            SensorService.add_new_sensor(vin, mapped_data)

        elif data['event'] == 'modify':
            logger.info("Updating existing sensor")
            SensorService.update_sensor(vin, mapped_data)

        elif data['event'] == 'delete':
            logger.info("Deleting sensor")
            SensorService.remove_sensor(vin, mapped_data)


class TCUDeviceData:
    """tcu devices create new entries in the Elasticsearch
    index: shared_cardata. This data will include all baseline
    info. concerning a new vehicle:
    - Vehicle attributes
    - Tcu attributes"""

    @staticmethod
    def validator(data):
        """validate each payload in the list.
        If specific payload is invalid, it will
        not be included in the data sent to ES."""
        logger.info("Entering validator")

        try:
            TCUSchema().load(data)
            return True
        except ValidationError as err:
            logger.error("TCU data validation error: {}".format(err))


class MessageProcessor:
    """handle incoming event message per type of device"""

    @staticmethod
    def process_device_list(device_list):
        """iterate through incoming list of devices (kinesis stream)"""
        logger.info("Entering process_device_list")

        tcu_device_list = list()

        for device in device_list:

            device_type_response = MessageProcessor.check_device_type(device)

            # if incoming device is templateId = auto_ecu
            if device_type_response == 'tcu':

                validate = TCUDeviceData.validator(device['payload'])

                if validate:
                    logger.info("Incoming tcu device has been validated...")

                    device_obj = {
                        'devices': [],
                        'attributes': {},
                        'vin': ''
                    }

                    # fetch cdf device data (more comprehensive)
                    device_id = device['objectid']
                    complete_device_response = TCUService.cdf_device_data(device_id)

                    if complete_device_response:

                        # map and append device data
                        device_mapped_data = CDFAutoUtils.tcu_device_mapper(complete_device_response)
                        device_obj['devices'].append(device_mapped_data)

                        # add vehicle data (attributes)
                        vin = complete_device_response['groups']['installed_in'][0].split('/')[3].upper()
                        device_obj['vin'] = vin
                        vehicle_data_response = TCUService.cdf_vehicle_data(vin)
                        device_obj['attributes'].update(vehicle_data_response)

                        # add to device list (bulk)
                        tcu_device_list.append(device_obj)

            # if incoming device is templateId = sensor/other
            elif device_type_response == 'sensor':
                validate = SensorDeviceData.validator(device['payload'])

                if validate:
                    SensorDeviceData.device_processor(device)

        # bulk insert
        if tcu_device_list:
            TCUService.add_new_tcu(tcu_device_list)

    @staticmethod
    def check_device_type(data):
        """determine type of incoming device. The type
        will determine the course of action to take."""
        logger.info("Entering check_device_type")

        device_type = ''

        # 'modify' updated event
        if data['event'] == 'modify':

            if 'payload' in data.keys():

                # fetch only installed status for tcu
                if 'status' in data['payload']['attributes']:
                    if data['payload']['attributes']['status'] == 'installed' and data['payload']['templateid'] == 'auto_ecu':
                        logger.info("Device is AUTO ECU: tcu")
                        device_type = 'tcu'

                elif data['payload']['templateid'] == 'sensor':
                    logger.info("Device is modified sensor")
                    device_type = 'sensor'

        # 'create' / 'delete' event (not focusing on deletion of tcu)
        else:
            if 'payload' in data.keys():
                # can extend this to include other device types
                if data['payload']['templateid'] == 'sensor':
                    logger.info("This device is type Sensor")
                    device_type = 'sensor'

        return device_type


def lambda_handler(event, context):
    """Handler for IoT cardata rule telemetry"""
    logger.info("Incoming event: {}".format(event))

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

        # evaluate the device list
        MessageProcessor.process_device_list(updated_data)

    except Exception as err:
        logger.error("General error: {}".format(err))
