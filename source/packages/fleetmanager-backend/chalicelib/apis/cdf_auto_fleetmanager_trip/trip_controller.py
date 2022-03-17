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
import urllib.parse
from chalicelib.apis.cdf_auto_fleetmanager_trip.trip_service import Trip
from chalice import Blueprint, CognitoUserPoolAuthorizer, Response
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

trip_module = Blueprint(__name__)
authorizer = CognitoUserPoolAuthorizer('AuthPool', provider_arns=[{"Ref": "CognitoUserPoolArn"}])


@trip_module.route('/vehicles/{vin}/trips', name='api-trips', cors=True, methods=['GET'], authorizer=authorizer)
def trips(vin):
    """returns all trip data per vin param and possible pagination param.
    Params:
        - vin: QAPBQ88CXEA10002
        - (Initial request = not required. All other requests = required)
        pagination: [xxxxxxxxxxxx, yBbQ9XAB3_tVhPD0DI6e]
        - dates: "{\"date\":{\"start\":null,\"end\":null}}"
    Returns:
        Object:
            trips: list of trip objects
    """

    try:
        if trip_module.current_request.query_params.get('filters'):
            payload = trip_module.current_request.query_params.get('filters')
            decode_payload = urllib.parse.unquote(payload)
            json_payload = json.loads(decode_payload)

            return Trip.trips(vin, json_payload)

        else:
            return Response(status_code=400, body=str("Missing filter parameters"))

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))
