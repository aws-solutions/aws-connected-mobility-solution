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
"""Return list of aggregated vehicles (geohash) and detailed vehicle data (paginated)
from the latest_telemetry index in elasticsearch"""
import json
from chalicelib.utils.cdf_auto_fleetmanager_vehicle_data_util import CDFAutoUtils
from chalice import BadRequestError, UnauthorizedError, NotFoundError, ChaliceViewError
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


def aggegrated_vehicles(json_payload):
    """Get all vehicles (unique) based on latest entry"""

    logger.info("Entering aggegrated_vehicles")

    final_vehicles_response = {
        'vehicleCount': 0,
        'filters': {},
        'vehicles': [],
        'clusters': [],
        'offset': 0
    }

    # [left,bottom,right,top]
    # [-106.64558446594,25.837394039293,-93.5080380125658,36.5003505544947]

    url = CDFAutoUtils.url_builder('latest_telemetry')

    query_coordinates = CDFAutoUtils.es_query_builder('filtered', json_payload, aggregated=True)

    agg_response = CDFAutoUtils.es_request(url, query_coordinates)
    json_response = json.loads(agg_response.text)

    if 'hits' in json_response.keys():

        if len(json_response['hits']['hits']):

            # build vehicle response object(s)
            vehicle_data = CDFAutoUtils.build_vehicle_list(json_response)

            # pull request template for pagaination size
            es_query_vehicle = CDFAutoUtils.load_data_template('es_query_template.json')

            # check for pagination
            if len(json_response['hits']['hits']) == json_payload['pagination']['maxResults']:
                new_offset = json_payload['pagination']['offset'] + json_payload['pagination']['maxResults']
                final_vehicles_response['offset'] = new_offset
            else:
                final_vehicles_response['offset'] = None

            # sort the final vehicle list of objects
            sorted_vehicles = sorted(vehicle_data, key=lambda k: k['vin'], reverse=True)
            final_vehicles_response['vehicles'] = sorted_vehicles

            filter_data = CDFAutoUtils.build_filter_data(json_response)

            # set filters & vehicleCount responses
            final_vehicles_response['filters'] = filter_data['filters']
            final_vehicles_response['vehicleCount'] = json_response['aggregations']['vehicle_count']['value']

            # request bbox - could be more than one (query multi-coordinates)
            incoming_bbox = json_payload['filters']['boundaries']

            # adjust the response bbox from es to the bbox incoming request from the ui
            updated_agg_data = CDFAutoUtils.ui_boundary_geotile_fix(agg_data=json_response['aggregations'], request_bbox=incoming_bbox)

            # build cluster response
            for agg_obj_key, agg_obj_value in updated_agg_data.items():

                if agg_obj_key != 'anomaly_codes' and agg_obj_key != 'dtc_codes' and agg_obj_key != 'vehicle_count':

                    for geo_obj in agg_obj_value['zoom']['buckets']:
                        bbox_center = CDFAutoUtils.calculate_geotile_center(geo_obj['bbox'])

                        temp_cluster = {
                            'coordinates': bbox_center,
                            'properties': {
                                'bbox': geo_obj['bbox'],
                                'key': geo_obj['key'],
                                'count': geo_obj['doc_count']
                            }
                        }

                        if geo_obj['doc_count'] == 1:
                            temp_cluster['properties']['vin'] = geo_obj['vin']['buckets'][0]['key']

                        final_vehicles_response['clusters'].append(temp_cluster)

        else:
            # no es response -> removal of these keys for the UI
            del final_vehicles_response['filters']
            final_vehicles_response['offset'] = None

        return final_vehicles_response

    else:
        raise ChaliceViewError(json_response['error']['type'])
