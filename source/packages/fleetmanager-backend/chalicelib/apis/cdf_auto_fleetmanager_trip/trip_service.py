# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Trip function for two endpoints:
1. trip api: return all trip data per vin
    - params: vin, start and end timestamps"""

import json
import logging
from chalicelib.utils.cdf_auto_fleetmanager_vehicle_data_util import CDFAutoUtils
from chalice import BadRequestError
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class Trip:

    @staticmethod
    def trips(vin, json_payload):
        """return paginated trip data
        parameters:
            vin (for trip api)
            possible parameters:
                vin (required if no trip_id
                pagination (optional):
                    - timestamp: timestamp of last vehicle of previous request
                    - _id: ID of last vehicle from previous request
                dates (optional)
        """
        logger.info("Entering trips: %s", json_payload)

        url = CDFAutoUtils.url_builder('trip', '_search')

        json_payload['vin'] = vin
        query_trip = CDFAutoUtils.es_query_builder('trip', json_payload)
        es_response = CDFAutoUtils.es_request(url, query_trip)

        json_response = json.loads(es_response.text)

        final_trips_response = {
                'trips': [],
                'offset': 0
            }

        if 'hits' in json_response:

            if len(json_response['hits']['hits']):
                build_trip_data = CDFAutoUtils.build_trip_data(json_response)
                final_trips_response['trips'] = build_trip_data

                # check for pagination
                if len(json_response['hits']['hits']) == json_payload['pagination']['maxResults']:
                    new_offset = json_payload['pagination']['offset'] + json_payload['pagination']['maxResults']
                    final_trips_response['offset'] = new_offset
                else:
                    final_trips_response['offset'] = None

            else:
                final_trips_response['offset'] = None

            return final_trips_response

        else:
            raise BadRequestError(json_response['error']['type'])
