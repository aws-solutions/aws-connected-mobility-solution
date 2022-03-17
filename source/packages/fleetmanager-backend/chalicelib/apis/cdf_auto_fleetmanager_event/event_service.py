# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Return event data per the parameter: vin"""

import json
from chalicelib.utils.cdf_auto_fleetmanager_vehicle_data_util import CDFAutoUtils
from chalice import BadRequestError, NotFoundError
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


class Events:

    @staticmethod
    def events(vin, json_payload):
        """return the event data for a vin from ES"""
        logger.info("Entering cdf_auto_event: %s", vin)

        # create elasticsearch request url based on index used
        url = CDFAutoUtils.url_builder('event', '_search')

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
            logger.error(json_response['error']['type'])
            raise BadRequestError(json_response['error']['type'])
