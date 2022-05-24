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
"""Return all vehicles based on incoming filter parameters"""
import json
import urllib.parse
from chalicelib.utils.cdf_auto_fleetmanager_vehicle_data_util import CDFAutoUtils
from chalice import BadRequestError, UnauthorizedError, NotFoundError, ChaliceViewError
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


def filtered_vehicles(json_payload):
    """Get vehicles (latest) based on incoming filters"""

    logger.info("Entering filtered_vehicles")

    final_vehicles_response = {
        'vehicleCount': 0,
        'filters': {},
        'vehicles': []
    }

    url = CDFAutoUtils.url_builder('latest_telemetry')

    query_coordinates = CDFAutoUtils.es_query_builder('filtered', json_payload)

    filter_response = CDFAutoUtils.es_request(url, query_coordinates)
    json_response = json.loads(filter_response.text)

    if 'hits' in json_response.keys():

        if len(json_response['hits']['hits']):

            # build vehicle response object(s)
            vehicle_data = CDFAutoUtils.build_vehicle_list(json_response)

            # sort the final vehicle list of objects
            sorted_vehicles = sorted(vehicle_data, key=lambda k: k['vin'], reverse=True)
            final_vehicles_response['vehicles'] = sorted_vehicles

            filter_data = CDFAutoUtils.build_filter_data(json_response)

            # set filters & vehicleCount responses
            final_vehicles_response['filters'] = filter_data['filters']
            final_vehicles_response['vehicleCount'] = json_response['aggregations']['vehicle_count']['value']

        else:
            # no es response -> removal of these keys for the UI
            del final_vehicles_response['filters']
            del final_vehicles_response['vehicleCount']

        return final_vehicles_response
    else:
        raise ChaliceViewError(json_response['error']['type'])
