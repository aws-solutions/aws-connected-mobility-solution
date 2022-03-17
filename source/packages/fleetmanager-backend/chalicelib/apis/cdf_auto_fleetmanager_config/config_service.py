# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Create/Update config data in SSM - Parameter Store"""

import boto3
import json
from chalice import BadRequestError, NotFoundError
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

CLIENT = boto3.client('ssm')


class Config:

    @staticmethod
    def get_parameter(name):
        """Per incoming name, return
        parameter store value"""
        logger.info("Entering get_parameter: %s", name)

        try:
            response = CLIENT.get_parameter(
                Name=name,
                WithDecryption=False
            )

            temp_resp = {
                response['Parameter']['Name']: response['Parameter']['Value']
            }

            return temp_resp

        except Exception as err:
            logger.error("Error parameter store value: %s", err)
            raise BadRequestError(err)

    @staticmethod
    def create_update_parameter(data):
        """Per incoming name, return
        parameter store value"""
        logger.info("Entering create_update_parameter: %s", data)

        try:
            response = CLIENT.put_parameter(
                Name=data['name'],
                Description=data['description'],
                Value=data['value'],
                Type='String',
                Overwrite=True,
                AllowedPattern='^(?!\d+$)\w+\S+',
                Tier='Standard'
            )

            if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                logger.info("Successfully created config")
                return True
            else:
                logger.error("Create/Update error: %s", response)
                raise BadRequestError(response)

        except Exception as err:
            logger.error("Error creating/updating parameter store value: %s", err)
            raise BadRequestError(err)
