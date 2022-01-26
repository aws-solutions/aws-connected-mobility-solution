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
"""Return list of devices status for OTA job"""
import os
from datetime import datetime
import asyncio
import functools
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


# Util
def json_serial(obj):
    if isinstance(obj, (datetime)):
        return obj.timestamp()
    raise ChaliceViewError("Return data error - datetime")


async def get_devices_status(job_id, device_list):
    logger.info("Entering get_devices_status")
    loop = asyncio.get_running_loop()

    try:
        executions = await asyncio.gather(
            *[
                loop.run_in_executor(None, functools.partial(
                    CLIENT.describe_job_execution,
                    jobId=job_id,
                    thingName=thing.upper()
                    )
                )
                for thing in device_list
            ]
        )

        return executions
    except Exception as err:
        raise ChaliceViewError(err)


def process_statuses(job_id, device_list):
    logger.info("Entering process_statuses")

    loop = asyncio.get_event_loop()
    raw = loop.run_until_complete(get_devices_status(job_id, device_list))
    formatted_list = list()

    for status_obj in raw:
        status_obj['execution']['deviceId'] = status_obj['execution']['thingArn'].split('/')[-1]
        obj = {'execution': status_obj['execution']}
        formatted_list.append(obj)

    response = json.dumps(formatted_list, default=json_serial)
    return response
