# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""DDB table enntry trigger:
- anomaly data from DDB table --> this lambda --> elasticsearch"""

import logging
from cdf_auto_fleetmanager_util import CDFAutoUtils
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class AnomalyDDBService:

    @staticmethod
    def add_shared_cardata_index(vin, payload):
        """POST data into elasticsearch index"""
        logger.info("Entering add_shared_cardata_index")

        url = CDFAutoUtils.url_builder('shared_cardata', '_update_by_query')

        query = {
            "script": {
                "source": "ctx._source.anomalies = [params.anomaly]",
                "params": {
                    "anomaly": payload
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
    def add_anomaly_index(payload):
        """Adding dtc object to elasticsearch index"""
        logger.info("Entering add_anomaly_index")

        url = CDFAutoUtils.url_builder('anomaly', '_doc')
        CDFAutoUtils.es_add_update(url, payload)
