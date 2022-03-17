# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Controller for dahsboard apis"""

import json
import urllib.parse
from chalicelib.apis.cdf_auto_fleetmanager_charts.charts_service import Charts
from chalicelib.utils.validators.charts_api_validator import ChartsFilterAPISchema
from chalice import Blueprint, CognitoUserPoolAuthorizer, Response
from marshmallow import ValidationError
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

charts_module = Blueprint(__name__)
authorizer = CognitoUserPoolAuthorizer('AuthPool', provider_arns=[{"Ref": "CognitoUserPoolArn"}])

@charts_module.route('/charts/stats', name='api-charts-stats', cors=True, methods=['GET'])
def charts_values():
    """
    return data for charts

    """
    try:
        try:
            return Charts.get_stats()

        except ValidationError as err:
            raise ValidationError(err.messages)

        # else:
        #     return Response(status_code=400, body=str("Missing filter parameters"))
    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))

