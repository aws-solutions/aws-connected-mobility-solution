# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""OTA controller via CDF Commands for vehicles in CDF Asset Library"""

import os
import json
from marshmallow import ValidationError
from chalice import Blueprint, Response, CognitoUserPoolAuthorizer
from chalicelib.apis.cdf_auto_fleetmanager_ota.ota_service import CreateOTA, OTAJobsList, OTAJobDevicesList, OTAJobDevicesStatus
from chalicelib.utils.validators.ota_create_validator import OTACreateSchema
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

ota_module = Blueprint(__name__)
authorizer = CognitoUserPoolAuthorizer('AuthPool', provider_arns=[{"Ref": "CognitoUserPoolArn"}])


@ota_module.route('/ota/create', name='api-ota-create-multi', cors=True, methods=['POST'], authorizer=authorizer)
def ota_create_job_multi():
    """Creates job per filter data.
    Body:
    {
    "desiredVersion": "string",
    "filters": {
        "anomalies": ["string"],
        "troubleCodes": ["string"],
        "vehicle": {
        "vin": ["string"],
        "make": ["string"],
        "model": ["string"],
        "year": [number]
        },
        "software": {
        "swVersion": "string"
        }
    }
    }
    Response: { jobId }
    """

    request = ota_module.current_request

    try:
        parameters = request.json_body

        try:
            OTACreateSchema().load(parameters)
            return CreateOTA.ota_manager(parameters, 'multi')

        except ValidationError as err:
            logger.error("Validation error: {}".format(err))
            raise ValidationError(err.messages)

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))


@ota_module.route('/ota/create/{device_id}', name='api-ota-create-single', cors=True, methods=['POST'], authorizer=authorizer)
def ota_create_job_single(device_id):
    """Creates job for single device per device_id.
    Body:
    {
    "desiredVersion": "5.1"
      }
    Response: { jobId }
    """

    request = ota_module.current_request

    try:
        parameters = request.json_body

        try:
            OTACreateSchema().load(parameters)
            parameters['deviceId'] = device_id
            return CreateOTA.ota_manager(parameters, 'single')

        except ValidationError as err:
            logger.error("Validation error: {}".format(err))
            raise ValidationError(err.messages)

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))


@ota_module.route('/ota', name='api-ota-jobs', cors=True, methods=['GET'], authorizer=authorizer)
def ota_jobs():
    """
    Return List of current jobs

    *Possible pagination: ?nextToken=token
    Response:
        {
            "jobs": []
            "nextToken": string
        }
    """

    pagination_token = ''

    try:
        if ota_module.current_request.query_params:
            if 'token' in ota_module.current_request.query_params:
                pagination_token = ota_module.current_request.query_params.get('token')

        return OTAJobsList.get_jobs(pagination_token)

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))


@ota_module.route('/ota/{job_id}/devices', name='api-ota-job-devices', cors=True, methods=['GET'], authorizer=authorizer)
def ota_job_devices(job_id):
    """
    Return List of all job devices (map vins for each device)

    *Possible pagination: ?nextToken=token
    Response:
    {
        "executionSummaries": [
        {
            "jobExecutionSummary": {
                "executionNumber": number,
                "lastUpdatedAt": number,
                "queuedAt": number,
                "startedAt": number,
                "status": "string"
            },
            "thingArn": "string",
            "vin": "Z876SDF87HKJSDF",
            "deviceId": "ECU-ZZYZYZYZ",
        }
    ],
    "nextToken": "string"
    }
    """

    pagination_token = ''

    try:
        if ota_module.current_request.query_params:
            if 'token' in ota_module.current_request.query_params:
                    pagination_token = ota_module.current_request.query_params.get('token')

        return OTAJobDevicesList.process_job_devices(job_id, pagination_token)

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))


@ota_module.route('/ota/{job_id}/devices/status', name='api-ota-devices-status', cors=True, methods=['GET'], authorizer=authorizer)
def ota_devices_status(job_id):
    """
    Return List of device statuses

    Parameters: ?filter=devId1,devId2,devId3
    Limit=20

    Response:
    {
        "executionSummaries": [
        {
            "execution": {
                "approximateSecondsBeforeTimedOut": number,
                "executionNumber": number,
                "forceCanceled": boolean,
                "jobId": "string",
                "lastUpdatedAt": number,
                "queuedAt": number,
                "startedAt": number,
                "status": "string",
                "statusDetails": {
                "detailsMap": {
                    "string" : "string"
                }
                },
                "thingArn": "string",
                "versionNumber": number,
                "deviceId": "ECU-ZZYZYZYZ"
            }
        }
        ]
    }
    """

    logger.info("PARAM: {}".format(ota_module.current_request.query_params))

    try:

        if ota_module.current_request.query_params:
            payload = ota_module.current_request.query_params.get('filters')
            param_list = payload.split(',')

            if len(param_list) <= 20:
                return OTAJobDevicesStatus.process_statuses(job_id, param_list)
            else:
                return Response(status_code=400, body=str("Cannont exceed 20 devices per request"))
        else:
            return Response(status_code=400, body="Missing filter parameters (list device ids)")

    except Exception as err:
        logger.error("General error: {}".format(err))
        return Response(status_code=400, body=str(err))
