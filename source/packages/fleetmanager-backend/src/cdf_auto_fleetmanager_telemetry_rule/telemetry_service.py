# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Lambda that ingests data from IoT rule in relation with cardata telemetry
from the topic dt/cvra/+/cardata. This telemetry is mapped with location
coordinates set up for polygon search mapping in elasticsearch.

The 2nd part to this is adding only the latest telemetry to index:
latest_telemetry. This index will be used for latest geo-coordinate queries.

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

        # action = '_doc/' + payload['vin']
        # url = CDFAutoUtils.url_builder('latest_telemetry', action)
        # CDFAutoUtils.es_add_update(url, payload)
        CDFAutoUtils.es_bulk(payload, 'latest_telemetry')

    @staticmethod
    def add_to_cardata_index(payload):
        """POST data into elasticsearch index"""
        logger.info("Entering add_to_cardata_index: %s", payload)

        # url = CDFAutoUtils.url_builder('cardata', '_doc')
        # CDFAutoUtils.es_add_update(url, payload)
        CDFAutoUtils.es_bulk(payload, 'cardata')

    @staticmethod
    def get_shared_data(vin):
        """GET shared_cardata from elasticsearch index per vin"""
        logger.info("Entering get_shared_data with vin: %s", vin)

        url = CDFAutoUtils.url_builder('shared_cardata', '_search')

        query = {
            "query": {
                "term": {
                    "vin.keyword": vin
                }
            }
        }

        logger.info("Final url: {} and query: {}".format(url, query))

        es_response = CDFAutoUtils.es_request(url, query)
        return json.loads(es_response.text)
