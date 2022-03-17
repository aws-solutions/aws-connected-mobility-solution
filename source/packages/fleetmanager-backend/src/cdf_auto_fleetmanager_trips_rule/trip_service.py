# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Send Trip data to ES index: trip"""

from cdf_auto_fleetmanager_util import CDFAutoUtils
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class TripService:

    @staticmethod
    def post_trip(payload):
        """POST data into elasticsearch index"""
        logger.info("Entering post_trip")
        CDFAutoUtils.es_bulk(payload, 'trip')
