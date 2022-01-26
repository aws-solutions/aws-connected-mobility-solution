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
"""Return list of OTA Jobs"""
from datetime import datetime
import boto3
import json
import logging
from chalice import BadRequestError, ChaliceViewError
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

CLIENT = boto3.client('iot')


def json_serial(obj):
    if isinstance(obj, (datetime)):
        return obj.timestamp()
    raise ChaliceViewError("Return data error - datetime")


def get_jobs(token=None):

    try:
        jobs_response = CLIENT.list_jobs(
            targetSelection='SNAPSHOT',
            maxResults=50,
            nextToken=token
        )
        logger.info("jobs reponse: %s", jobs_response)

        del jobs_response['ResponseMetadata']

        return json.dumps(jobs_response, default=json_serial)

    except Exception as err:
        logger.error("Get OTA jobs: %s", err)
        raise ChaliceViewError(err)
