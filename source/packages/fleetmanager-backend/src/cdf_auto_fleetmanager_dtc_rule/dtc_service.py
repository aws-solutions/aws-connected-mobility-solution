# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Lambda that ingests data from IoT rule for DTC topic:
    dt/cvra/+/dtc --> elasticsearch.
    One DTC per vehicle in shared_cardata index"""

from cdf_auto_fleetmanager_util import CDFAutoUtils
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class DtcService:

    @staticmethod
    def add_shared_cardata_index(vin, payload):
        """POST data into elasticsearch indexes:
        shared_cardata -> pulled from published telemetry"""

        logger.info("Entering add_shared_cardata_index")

        url = CDFAutoUtils.url_builder('shared_cardata', '_update_by_query')

        query = {
            "script": {
                "source": "ctx._source.trouble_codes = [params.dtc]",
                "params": {
                    "dtc": payload
                }
            },
            "query": {
                    "query_string": {
                        "query": vin
                        }
                    }
        }

        logger.info("Final url: {} and query: {}".format(url, query))

        CDFAutoUtils.es_add_update(url, query)

    @staticmethod
    def add_dtc_index(payload):
        """Adding dtc object to elasticsearch index"""
        logger.info("Entering add_dtc_index: {}".format(payload))

        CDFAutoUtils.es_bulk(payload, 'dtc')
