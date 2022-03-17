# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------

"""Return event data per the parameter: vin"""
import json
import urllib.parse
from chalice import Blueprint, Response, CognitoUserPoolAuthorizer
from chalicelib.apis.cdf_auto_fleetmanager_event.event_service import Events
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

event_module = Blueprint(__name__)
authorizer = CognitoUserPoolAuthorizer('AuthPool', provider_arns=[{"Ref": "CognitoUserPoolArn"}])


@event_module.route('/vehicles/{vin}/events', name='api-events', cors=True, methods=['GET'], authorizer=authorizer)
def events(vin):
    """returns all event data per vin param and possible
    pagination param.
    Params:
        - vin: QAPBQ88CXEA10002
        - (Initial request = not required. All other requests = required)
        pagination: [xxxxxxxxxxxx, yBbQ9XAB3_tVhPD0DI6e]
        - dates: "{\"date\":{\"start\":null,\"end\":null}}"
    Returns:
        Object:
            events: list of event objects
    """

    try:
        if event_module.current_request.query_params.get('filters'):
            payload = event_module.current_request.query_params.get('filters')
            decode_payload = urllib.parse.unquote(payload)
            json_payload = json.loads(decode_payload)

            events_response = Events.events(vin, json_payload)

            if events_response:
                return events_response

        else:
            logger.error("Missing filter parameters")
            return Response(status_code=400, body="Missing filter parameters")

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))
