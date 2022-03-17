# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Lambda that ingests data from IoT rule in relation with ev & tire cardata telemetry
from the topic dt/cvra/+/evTire.

Adding telemetry to index:
latest_telemetry - for current data
cardata - for comparative cacluations with the current data

Validation for incoming data.
"""

import json
from cdf_auto_fleetmanager_util import CDFAutoUtils
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class TelemetryService:
    """PUT incoming data into the
    latest_telemetry es index, where only
    the latest (1) document (vin) will live.
    _id = vin
    """

    @staticmethod
    def add_to_latest_telemetry_index(payload):
        """add new payload to the latest_telemetry index"""
        logger.info("Entering add_to_latest_telemetry_index")

        CDFAutoUtils.es_bulk(payload, 'latest_telemetry')

    @staticmethod
    def add_to_cardata_index(payload):
        """POST data into elasticsearch index"""
        logger.info("Entering add_to_cardata_index: %s", payload)

        CDFAutoUtils.es_bulk(payload, 'cardata')
