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
"""Return event data per the parameter: vin"""
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


def events(vin, json_payload):
    """return the event data for a vin from ES"""
    logger.info("Entering cdf_auto_event: %s", vin)

    # create elasticsearch request url based on index used
    url = CDFAutoUtils.url_builder('event')

    json_payload['vin'] = vin

    # build type query
    query_event = CDFAutoUtils.es_query_builder('event', json_payload)

    # elasticsearch query
    es_response = CDFAutoUtils.es_request(url, query_event)

    json_response = json.loads(es_response.text)

    final_events_response = {
            'events': [],
            'offset': []
        }

    if 'hits' in json_response.keys():

        if len(json_response['hits']['hits']):
            build_event_data = CDFAutoUtils.build_event_data(json_response)
            final_events_response['events'] = build_event_data

            # check for pagination
            if len(json_response['hits']['hits']) == json_payload['pagination']['maxResults']:
                new_offset = json_payload['pagination']['offset'] + json_payload['pagination']['maxResults']
                final_events_response['offset'] = new_offset
            else:
                final_events_response['offset'] = None

        else:
            final_events_response['offset'] = None

        return final_events_response

    else:
        raise ChaliceViewError(json_response['error']['type'])
