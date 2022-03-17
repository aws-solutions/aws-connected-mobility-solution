# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Service file for stats/charts requests"""

import json
from chalicelib.utils.cdf_auto_fleetmanager_vehicle_data_util import CDFAutoUtils
from chalice import BadRequestError, NotFoundError
import logging
import datetime
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

# class for analytics on  the 4 weeks from october to november for a set of vehicles (efficiency)
class Charts:
    
    @staticmethod
    def get_stats():
        logger.info("Charts api table: %s")
        json_payload = {}
        final_response = {}
        payload_list = []
        stats_list = []

        # get values
        url = CDFAutoUtils.url_builder('cardata', '_search')
        query_charts_queries = CDFAutoUtils.es_query_builder('charts_analytics', json_payload)
        if len(query_charts_queries):
            for query in query_charts_queries:
                es_response = CDFAutoUtils.es_request(url, query)
                json_response = json.loads(es_response.text)
                payload_list.append(json_response)

        if len(payload_list):
            stats_list = CDFAutoUtils.get_chart_analytics(payload_list)

        final_response = {'data':stats_list}
        return final_response

    


