# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Create/Update config data in SSM - Parameter Store"""

import boto3
import json
from marshmallow import Schema, fields, ValidationError
from chalice import Blueprint, Response, CognitoUserPoolAuthorizer
from chalicelib.apis.cdf_auto_fleetmanager_config.config_service import Config
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

CLIENT = boto3.client('ssm')

parameter_store_module = Blueprint(__name__)
authorizer = CognitoUserPoolAuthorizer('AuthPool', provider_arns=[{"Ref": "CognitoUserPoolArn"}])


class ParameterSchema(Schema):
    """Validator"""
    name = fields.Str(required=True)
    description = fields.Str(required=True)
    value = fields.Str(required=True)


@parameter_store_module.route('/config', name='api-config', cors=True, methods=['GET', 'PUT'], authorizer=authorizer)
def config():
    """GET: retrieves configuration values required by application,
        SSM.getParameter
        ?parameter=mapboxToken

        Response:
        {mapboxToken: "string"}

        PUT: creates or overwrites a config value.
        SSM.putParameter
        """

    request = parameter_store_module.current_request

    if request.method == 'PUT':

        try:
            parameter = request.json_body
            ParameterSchema().load(parameter)
            create_response = Config.create_update_parameter(parameter)

            if create_response:
                return Response(status_code=204, body='')

        except ValidationError as err:
            logger.error(err.messages)
            raise ValidationError(err.messages)

        except Exception as err:
            logger.error("General error: {}".format(err))
            return Response(status_code=400, body=str(err))

    elif request.method == 'GET':

        try:
            parameter = parameter_store_module.current_request.query_params.get('parameter')
            return Config.get_parameter(parameter)

        except Exception as err:
            logger.error("General error: {}".format(err))
            return Response(status_code=400, body=str(err))
