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
"""Trip function for two endpoints:
1. trip api: return all trip data per vin
    - params: vin, start and end timestamps"""

import json
import logging
from chalicelib.utils.cdf_auto_fleetmanager_vehicle_data_util import CDFAutoUtils
from chalice import BadRequestError, UnauthorizedError, NotFoundError, ChaliceViewError
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


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

    url = CDFAutoUtils.url_builder('trip')

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
        raise ChaliceViewError(json_response['error']['type'])
