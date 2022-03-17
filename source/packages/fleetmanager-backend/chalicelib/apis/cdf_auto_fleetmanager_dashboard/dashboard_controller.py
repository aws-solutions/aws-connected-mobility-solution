# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Controller for dahsboard apis"""

import json
import urllib.parse
from chalicelib.apis.cdf_auto_fleetmanager_dashboard.dashboard_service import Dashboard
from chalicelib.utils.validators.dashboard_api_validator import DashboardFilterAPISchema
from chalice import Blueprint, CognitoUserPoolAuthorizer, Response
from marshmallow import ValidationError
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

dashboard_module = Blueprint(__name__)
authorizer = CognitoUserPoolAuthorizer('AuthPool', provider_arns=[{"Ref": "CognitoUserPoolArn"}])


@dashboard_module.route('/dashboard/tirepressure', name='api-filter-tirepressure', cors=True, methods=['POST'])
def list_pressure():
    """
    return data from tire pressure table

    """
    try:
        # if dashboard_module.current_request:
        payload = dashboard_module.current_request.json_body
        # decode_payload = urllib.parse.unquote(payload)
        # json_payload = json.loads(payload)

        try:
            payload = DashboardFilterAPISchema().load(payload)
            
            return Dashboard.tire_pressure_event(payload)

        except ValidationError as err:
            raise ValidationError(err.messages)

        # else:
        #     return Response(status_code=400, body=str("Missing filter parameters"))
    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))


@dashboard_module.route('/dashboard/battery', name='api-filter-battery', cors=True, methods=['POST'])
def list_battery():
    """
    returns battery information accessing battery table Current SOC, min max roc in last 24 hours
    
    """
    try:
        # if dashboard_module.current_request:
        payload = dashboard_module.current_request.json_body
        # decode_payload = urllib.parse.unquote(payload)
        # json_payload = json.loads(payload)

        try:
            payload = DashboardFilterAPISchema().load(payload)
            
            return Dashboard.battery_event(payload)

        except ValidationError as err:
            raise ValidationError(err.messages)

        # else:
        #     return Response(status_code=400, body=str("Missing filter parameters"))
    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))


@dashboard_module.route('/dashboard/notcharging', name='api-filter-notcharging', cors=True, methods=['POST'])
def list_vehicles_notcharging():
    """
    returns vehicle not charging from not charging table
    
    """
    try:
        # if dashboard_module.current_request:
        payload = dashboard_module.current_request.json_body
        # decode_payload = urllib.parse.unquote(payload)
        # json_payload = json.loads(payload)

        try:
            payload = DashboardFilterAPISchema().load(payload)
            
            return Dashboard.not_charging_event(payload)

        except ValidationError as err:
            raise ValidationError(err.messages)

        # else:
        #     return Response(status_code=400, body=str("Missing filter parameters"))
    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))


@dashboard_module.route('/dashboard/efficency', name='api-filter-efficency', cors=True, methods=['POST'])
def list_efficency():
    """
    return efficency since last charge for battery
    
    """
    try:
        # if dashboard_module.current_request:
        payload = dashboard_module.current_request.json_body
        # decode_payload = urllib.parse.unquote(payload)
        # json_payload = json.loads(payload)

        try:
            payload = DashboardFilterAPISchema().load(payload)
            
            return Dashboard.efficency_event(payload)

        except ValidationError as err:
            raise ValidationError(err.messages)

        # else:
        #     return Response(status_code=400, body=str("Missing filter parameters"))
    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))
