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
"""Return encoded route based on:
- incoming trip_id
    - pull vin/start/end from trip index in elasticsearch
- pull telemetry data from cardata index based on the data pulled
from the trip index (vin/start/end)"""

import json
import polyline
from chalicelib.utils.cdf_auto_fleetmanager_vehicle_data_util import CDFAutoUtils
from chalice import BadRequestError, UnauthorizedError, NotFoundError, ChaliceViewError
from collections import Counter
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


def get_single_trip(trip_id):
    """return trip data for route api query"""
    logger.info("Entering get_single_trip")

    url = CDFAutoUtils.url_builder('trip')

    temp_dict = {
        'trip_id': trip_id
    }

    query_trip = CDFAutoUtils.es_query_builder('trip', temp_dict)
    es_response = CDFAutoUtils.es_request(url, query_trip)

    try:
        json.loads(es_response.text)
        return json.loads(es_response.text)
    except Exception as err:
        logger.error("Trip query general error: %s", err)
        raise ChaliceViewError(err)


def route(trip_id):
    """query es for the latest cardata telemetry
    based on timestamps and vin, to deterine a route:
    (trip index in elasticsearch)"""

    logger.info("Entering route")

    # 1st fetch vin from trip index
    trip_response = get_single_trip(trip_id)

    if 'hits' in trip_response.keys():

        if len(trip_response['hits']['hits']):

            final_obj = {
                'geometry': ''
            }

            # create elasticsearch request url based on index used
            url = CDFAutoUtils.url_builder('cardata')

            # create a param payload for the telemetry request from es
            vin = trip_response['hits']['hits'][0]['_source']['vin']
            trip_id = trip_response['hits']['hits'][0]['_source']['tripid']
            start = trip_response['hits']['hits'][0]['_source']['tripsummary']['starttime']
            end = trip_response['hits']['hits'][0]['_source']['creationtimestamp']

            query_payload = {
                'vin': vin,
                'trip_id': trip_id,
                'start': start,
                'end': end
            }

            # 2nd: build query for telemetry response
            query_route = CDFAutoUtils.es_query_builder('route', query_payload)

            # elasticsearch query
            es_response = CDFAutoUtils.es_request(url, query_route)

            # load cardata response object
            json_response = json.loads(es_response.text)

            # clean up response
            temp_coordinates = list()

            if 'hits' in json_response.keys():

                if len(json_response['hits']['hits']):

                    for telemetry in json_response['hits']['hits']:
                        temp_coordinates.append(telemetry['_source']['geolocation']['location'])

                    # clean up the duplicates & no 0.0 coordinates
                    cleaned_coordinates = list()

                    for coordinates, count in Counter(map(tuple, temp_coordinates)).items():
                        if coordinates != (0.0, 0.0) and count:
                            cleaned_coordinates.append(coordinates)

                    logger.info("cleaned_coordinates: %s", cleaned_coordinates)

                    compressed_list = ''

                    if len(cleaned_coordinates):
                        # convert list of coordinates to polyline encoding (geojson=True * lon/lat)
                        compressed_list = polyline.encode(cleaned_coordinates, geojson=True)

                    final_obj['geometry'] = compressed_list
                    return final_obj

                else:
                    raise NotFoundError("No Route data")
            else:
                raise ChaliceViewError(json_response['error']['type'])

        else:
            raise NotFoundError("No Trip data to request a Route")

    else:
        raise ChaliceViewError(trip_response['error']['type'])
