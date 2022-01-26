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
"""Return data for a single vehicle based on incoming vin"""
import json
import polyline
from chalicelib.utils.cdf_auto_fleetmanager_vehicle_data_util import CDFAutoUtils
from chalice import BadRequestError, UnauthorizedError, NotFoundError, ChaliceViewError
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


def single_vehicle(vin=None, bbox=None):
    """Get a vehicle (vin) based on latest entry"""
    logger.info("Entering single_vehicle")

    url = CDFAutoUtils.url_builder('latest_telemetry')

    query_one = CDFAutoUtils.es_query_builder('single', vin)
    es_response = CDFAutoUtils.es_request(url, query_one)
    json_response = json.loads(es_response.text)

    if 'hits' in json_response.keys():
        if len(json_response['hits']['hits']):
            vehicle_response = CDFAutoUtils.build_vehicle_list(json_response)
            filter_response = CDFAutoUtils.build_filter_data(json_response, single=True)
            vehicle_response[0]['troubleCodes'] = filter_response['filters']['troubleCodes']

            return vehicle_response[0]

        else:
            raise NotFoundError("No Vehicle data")
    else:
        raise ChaliceViewError(json_response['error']['type'])
