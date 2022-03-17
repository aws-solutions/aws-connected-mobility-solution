# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
#  Customer Agreement.
# ---------------------------------------------------------------------------------
"""Controller for vehicle apis"""

import json
import urllib.parse
from chalicelib.apis.cdf_auto_fleetmanager_vehicles.vehicles_service import Vehicles
from chalicelib.utils.validators.filter_api_validator import VehicleFilterAPISchema
from chalicelib.utils.validators.aggregation_api_validator import VehicleAggregateAPISchema
from chalice import Blueprint, CognitoUserPoolAuthorizer, Response
from marshmallow import ValidationError
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

vehicles_module = Blueprint(__name__)
authorizer = CognitoUserPoolAuthorizer('AuthPool', provider_arns=[{"Ref": "CognitoUserPoolArn"}])


@vehicles_module.route('/vehicles/aggregate', name='api-aggregated-vehicles', cors=True, methods=['GET'], authorizer=authorizer)
def aggregated_vehicles():
    """returns aggregated vehicle data (geohash) for UI map
    and paginated vehicle data (detailed) for UI list.
    Incoming bbox: [left,bottom,right,top]
    Returns:
    Obeject:
        - filters: object
        - results:
            - list of vehicle objects
            - list of geohashes and counts

    {
        "clusters":[
            {
            "coordinates":[-120.756226, 44.083639],
                "properties":{
                    "bbox":[-124.541016, 42.032974, -116.982422,46.073231],
                    "key":"u17gh",
                    "count":1
                }
            }
        ],
        "vehicles":[],
        "nextTokens":[]
        }
    """

    try:
        if vehicles_module.current_request.query_params.get('filters'):
            payload = vehicles_module.current_request.query_params.get('filters')
            decode_payload = urllib.parse.unquote(payload)
            json_payload = json.loads(decode_payload)

            try:
                VehicleAggregateAPISchema().load(json_payload)
                return Vehicles.aggegrated_vehicles(json_payload)

            except ValidationError as err:
                raise ValidationError(err.messages)

        else:
            return Response(status_code=400, body=str("Missing filter parameters"))

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))


@vehicles_module.route('/vehicles/filter', name='api-filter-vehicles', cors=True, methods=['GET'], authorizer=authorizer)
def filtered_vehicles():
    """returns filtered set of vehicles."""

    try:
        if vehicles_module.current_request.query_params.get('filters'):
            payload = vehicles_module.current_request.query_params.get('filters')
            decode_payload = urllib.parse.unquote(payload)
            json_payload = json.loads(decode_payload)

            try:
                VehicleFilterAPISchema().load(json_payload)
                return Vehicles.filtered_vehicles(json_payload)

            except ValidationError as err:
                raise ValidationError(err.messages)

        else:
            return Response(status_code=400, body=str("Missing filter parameters"))

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))


@vehicles_module.route('/vehicles/{vin}', name='api-single-vehicle', cors=True, methods=['GET'], authorizer=authorizer)
def single_vehicle(vin):
    """returns data for single vehicle per vin
    Returns:
        Obeject:
            - troubleCodes: list
            - swVersion: string
            - metadata: list
            - results: list containing 1 object
    """
    try:
        return Vehicles.single_vehicle(vin=vin)

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))
