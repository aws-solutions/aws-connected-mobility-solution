# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Lambda that ingests data from IoT rule for Event topic:
    dt/cvra/+/event --> elasticsearch."""

from cdf_auto_fleetmanager_util import CDFAutoUtils
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class EventService:

    @staticmethod
    def post_event(payload):
        """POST data into elasticsearch index"""
        logger.info("Entering post_event for event data")

        CDFAutoUtils.es_bulk(payload, 'event')
