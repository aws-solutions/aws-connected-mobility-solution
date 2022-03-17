# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Ingest data from IoT rule for Groups topic:
    cdf/assetlibrary/events/groups/# --> elasticsearch."""

import base64
from marshmallow import ValidationError
from cdf_auto_fleetmanager_util import CDFAutoUtils
from group_validator import ServiceSetGroupSchema
from group_service import GroupService, RemoteCommandControl
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class ServiceSetGroupData:
    """CDF asset library: when new service set groups are created
    and attached to a vehicle --> add/update vehicle data in
    Elasticsearch index -> shared_cardata"""

    @staticmethod
    def get_vin_cdf_group_path(data):
        """return vin from payload string with key, 'groups' that
        has vehicle group path included."""
        logger.info("Entering get_vin_cdf_group_path")

        vin_path = data['payload']['groups']['out']['available'][0]
        vin = vin_path.split('/')[3]

        return vin

    @staticmethod
    def validator(data):
        """validate each payload in the list.
        If specific payload is invalid, it will
        not be included in the data sent to ES."""
        logger.info("Entering validator")

        try:
            ServiceSetGroupSchema().load(data)
            return True
        except ValidationError as err:
            logger.error("Service Set group data validation error: {}".format(err))

    @staticmethod
    def process_set(service_set):
        logger.info("Entering process_set")

        # mapping section
        mapped_data = {
            'id': service_set['payload']['name'],
            'provider': service_set['payload']['attributes']['provider'],
            'services': []
        }

        for service in service_set['payload']['groups']['out']['included']:
            remote_command = RemoteCommandControl.cdf_remote_command_data(service)
            temp_service = {
                'service': service.split('/')[2],
                'remote': remote_command['states']
            }

            mapped_data['services'].append(temp_service)

        logger.info("Service set mapped obj: {}".format(mapped_data))

        # get vehicle vin from incoming data
        vin = ServiceSetGroupData.get_vin_cdf_group_path(service_set)

        if service_set['event'] == 'create':
            logger.info("Created new service set")
            GroupService.add_new_service_set(vin, mapped_data)

        elif service_set['event'] == 'modify':
            logger.info("Updating existing service set")
            GroupService.update_service_set(vin, mapped_data)

        elif service_set['event'] == 'delete':
            logger.info("Deleting service set")
            GroupService.remove_service_set(vin, mapped_data)


class MessageProcessor:
    """handle incoming event message per type of group"""

    @staticmethod
    def process_group_list(group_list):
        """iterate through incoming list of groups (kinesis stream)"""

        for group in group_list:
            group_type_response = MessageProcessor.check_group_type(group)

            if group_type_response == 'service_set':
                validate = ServiceSetGroupData.validator(group['payload'])

                if validate:
                    logger.info("Group data validated")
                    ServiceSetGroupData.process_set(group)

    @staticmethod
    def check_group_type(data):
        """determine type of incoming group. The type
        will determine the course of action to take."""
        logger.info("Entering check_group_type: {}".format(data))

        group_type = ''

        # key in on service set groups (extensible)
        if 'payload' in data.keys():
            if data['payload']['templateid'] == 'service_set':
                logger.info("Incoming new service set group")
                group_type = 'service_set'

        return group_type


def lambda_handler(event, context):

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

        # evaluate the group list
        MessageProcessor.process_group_list(updated_data)

    except Exception as err:
        logger.error("General error: {}".format(err))
