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
"""Create/Update config data in SSM - Parameter Store"""
import boto3
import json
from marshmallow import Schema, fields, ValidationError
from chalice import BadRequestError, UnauthorizedError, NotFoundError, ChaliceViewError
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

CLIENT = boto3.client('ssm')


class ParameterSchema(Schema):
    name = fields.Str(required=True)
    description = fields.Str(required=True)
    value = fields.Str(required=True)


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
        raise ChaliceViewError(err)


def create_update_parameter(data):
    """Per incoming name, return
      parameter store value"""
    logger.info("Entering create_update_parameter: %s", data)

    try:
        ParameterSchema().load(data)

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
                return ''
            else:
                logger.error("Create/Update error: %s", response)

        except Exception as err:
            logger.error("Error creating/updating parameter store value: %s", err)
            raise ChaliceViewError(err)

    except ValidationError as err:
        logger.error(err.messages)
        raise ChaliceViewError(err.messages)
