# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Cloudformation Custom Resource:
Setup IoT Event Based Messages to enable
MQTT to publish on job/thing topics. The end result is
when an OTA job is complete, listen for completion and
clear dtc/anomaly from elasticsearch for that vehicle."""

"""Return list of devices status for OTA job"""

import boto3
import logging
from crhelper import CfnResource
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

CLIENT = boto3.client('iot')

try:
    helper = CfnResource()
except Exception as e:
    helper.init_failure(e)


@helper.create
def update_iot_event_config(event, context):
    """Enable job execution to publish on MQTT topic"""
    logger.info("Entering update_iot_event_config")

    try:

        response = CLIENT.update_event_configurations(
            eventConfigurations={
                "JOB_EXECUTION": {
                    "Enabled": True
                },
                "JOB": {
                    "Enabled": True
                }
            }
        )
    except Exception as err:
        logger.error("IoT event config: {}".format(err))


@helper.delete
def no_op(_, __):
    pass


def lambda_handler(event, context):

    try:
        helper(event, context)
    except Exception as error:
        logger.error(error)
        helper.init_failure("Failing Gracefully...")
