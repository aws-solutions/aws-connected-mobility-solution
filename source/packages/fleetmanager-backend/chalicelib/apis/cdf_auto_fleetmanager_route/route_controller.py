# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Return encoded route based on:
- incoming trip_id
    - pull vin/start/end from trip index in elasticsearch
- pull telemetry data from cardata index based on the data pulled
from the trip index (vin/start/end)"""

from chalicelib.apis.cdf_auto_fleetmanager_route.route_service import Route
from chalice import Blueprint, Response, CognitoUserPoolAuthorizer
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

route_module = Blueprint(__name__)
authorizer = CognitoUserPoolAuthorizer('AuthPool', provider_arns=[{"Ref": "CognitoUserPoolArn"}])


@route_module.route('/vehicles/route/{trip_id}', name='api-route', cors=True, methods=['GET'], authorizer=authorizer)
def route(trip_id):
    """returns route for vehicle
    Params:
        - trip_id: bf638266-237b-11ea-9e0d-0242ac110002
    Returns:
        Object:
        geometry: encoded polyline (set of geo-coordinates)
    """
    try:
        return Route.build_route(trip_id)

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))
