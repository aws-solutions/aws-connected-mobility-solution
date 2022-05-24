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
import os
import json
import urllib.parse
from marshmallow import ValidationError
from chalice import CognitoUserPoolAuthorizer
from chalicelib.utils.filter_api_validator import VehicleFilterAPISchema
from chalicelib.utils.aggregation_api_validator import VehicleAggregateAPISchema
from chalicelib.utils.ota_create_validator import OTACreateSchema
from chalice import Chalice, Response
from chalice import BadRequestError, UnauthorizedError, NotFoundError
from chalicelib.apis import (
    cdf_auto_fleetmanager_event,
    cdf_auto_fleetmanager_trip,
    cdf_auto_fleetmanager_aggregated_vehicles,
    cdf_auto_fleetmanager_single_vehicle,
    cdf_auto_fleetmanager_filtered_vehicles,
    cdf_auto_fleetmanager_route,
    cdf_auto_fleetmanager_config,
    cdf_auto_fleetmanager_ota_create_job,
    cdf_auto_fleetmanager_ota_list_jobs,
    cdf_auto_fleetmanager_ota_list_job_devices,
    cdf_auto_fleetmanager_ota_list_job_devices_status
)
app = Chalice(app_name='cdf-auto-fleetmanager-backend')

authorizer = CognitoUserPoolAuthorizer('AuthPool', provider_arns=[{"Ref": "CognitoUserPoolArn"}])


#######################
#     API SECTION     #
#######################
@app.route('/vehicles/aggregate', name='api-aggregated-vehicles', cors=True, methods=['GET'], authorizer=authorizer)
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

	if app.current_request.query_params.get('filters'):
		payload = app.current_request.query_params.get('filters')
		decode_payload = urllib.parse.unquote(payload)
		json_payload = json.loads(decode_payload)

		try:
			VehicleAggregateAPISchema().load(json_payload)
			return cdf_auto_fleetmanager_aggregated_vehicles.aggegrated_vehicles(json_payload)
		except ValidationError as err:
			raise BadRequestError(err)

	else:
		raise BadRequestError("Missing filter parameters")


@app.route('/vehicles/filter', name='api-filter-vehicles', cors=True, methods=['GET'], authorizer=authorizer)
def filtered_vehicles():
	"""returns filtered set of vehicles."""

	if app.current_request.query_params.get('filters'):
		payload = app.current_request.query_params.get('filters')
		decode_payload = urllib.parse.unquote(payload)
		json_payload = json.loads(decode_payload)

		try:
			VehicleFilterAPISchema().load(json_payload)
			return cdf_auto_fleetmanager_filtered_vehicles.filtered_vehicles(json_payload)
		except ValidationError as err:
			raise BadRequestError(err)

	else:
		raise BadRequestError("Missing filter parameters")


@app.route('/vehicles/{vin}', name='api-single-vehicle', cors=True, methods=['GET'], authorizer=authorizer)
def single_vehicle(vin):
	"""returns data for single vehicle per vin
	Returns:
		Obeject:
			- troubleCodes: list
			- swVersion: string
			- metadata: list
			- results: list containing 1 object
	"""
	return cdf_auto_fleetmanager_single_vehicle.single_vehicle(vin=vin)


@app.route('/vehicles/{vin}/trips', name='api-trips', cors=True, methods=['GET'], authorizer=authorizer)
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

	if app.current_request.query_params.get('filters'):
		payload = app.current_request.query_params.get('filters')
		decode_payload = urllib.parse.unquote(payload)
		json_payload = json.loads(decode_payload)
		return cdf_auto_fleetmanager_trip.trips(vin, json_payload)

	else:
		raise BadRequestError("Missing filter parameters")


@app.route('/vehicles/{vin}/events', name='api-events', cors=True, methods=['GET'], authorizer=authorizer)
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

	if app.current_request.query_params.get('filters'):
		payload = app.current_request.query_params.get('filters')
		decode_payload = urllib.parse.unquote(payload)
		json_payload = json.loads(decode_payload)
		return cdf_auto_fleetmanager_event.events(vin, json_payload)

	else:
		raise BadRequestError("Missing filter parameters")


@app.route('/vehicles/route/{trip_id}', name='api-route', cors=True, methods=['GET'], authorizer=authorizer)
def route(trip_id):
	"""returns route for vehicle
	Params:
		- trip_id: bf638266-237b-11ea-9e0d-0242ac110002
	Returns:
		Object:
		geometry: encoded polyline (set of geo-coordinates)
	"""
	return cdf_auto_fleetmanager_route.route(trip_id)


# APPLICATION CONFIG SECTION
@app.route('/config', name='api-config', cors=True, methods=['GET', 'PUT'], authorizer=authorizer)
def config():
    """GET: retrieves configuration values required by application,
    SSM.getParameter
    ?parameter=mapboxToken

    Response:
    {
        mapboxToken: "string"
    }

    PUT: creates or overwrites a config value.
    SSM.putParameter
    """

    request = app.current_request

    if request.method == 'PUT':

        try:
            parameter = request.json_body
            return cdf_auto_fleetmanager_config.create_update_parameter(parameter)
        except Exception as err:
            raise NotFoundError("No config body found")

    elif request.method == 'GET':

        try:
            parameter = app.current_request.query_params.get('parameter')
            return cdf_auto_fleetmanager_config.get_parameter(parameter)
        except Exception as err:
            raise NotFoundError("No parameter provided")


# OTA SECTION
@app.route('/ota/create', name='api-ota-create-multi', cors=True, methods=['POST'], authorizer=authorizer)
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

    request = app.current_request

    try:
        parameters = request.json_body

        try:
            OTACreateSchema().load(parameters)
            return cdf_auto_fleetmanager_ota_create_job.main(parameters, 'multi')
        except ValidationError as err:
            raise BadRequestError(err)

    except Exception as err:
        raise NotFoundError(err)


@app.route('/ota/create/{device_id}', name='api-ota-create-single', cors=True, methods=['POST'], authorizer=authorizer)
def ota_create_job_single(device_id):
	"""Creates job for single device per device_id.
	Body:
	{
    "desiredVersion": "5.1"
  	}
	Response: { jobId }
	"""

	request = app.current_request

	try:
		parameters = request.json_body

		try:
			OTACreateSchema().load(parameters)
			parameters['deviceId'] = device_id
			return cdf_auto_fleetmanager_ota_create_job.main(parameters, 'single')

		except ValidationError as err:
			raise BadRequestError(err)

	except Exception as err:
		raise NotFoundError(err)


@app.route('/ota', name='api-ota-jobs', cors=True, methods=['GET'], authorizer=authorizer)
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

	if app.current_request.query_params:
		if 'token' in app.current_request.query_params:
				pagination_token = app.current_request.query_params.get('token')
	return cdf_auto_fleetmanager_ota_list_jobs.get_jobs(pagination_token)


@app.route('/ota/{job_id}/devices', name='api-ota-job-devices', cors=True, methods=['GET'], authorizer=authorizer)
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

	if app.current_request.query_params:
		if 'token' in app.current_request.query_params:
				pagination_token = app.current_request.query_params.get('token')

	return cdf_auto_fleetmanager_ota_list_job_devices.process_job_devices(job_id, pagination_token)


@app.route('/ota/{job_id}/devices/status', name='api-ota-devices-status', cors=True, methods=['GET'], authorizer=authorizer)
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

	if app.current_request.query_params.get('filters'):

			payload = app.current_request.query_params.get('filters')
			list_payload = payload.split(',')

			if len(list_payload) <= 20:
    				return cdf_auto_fleetmanager_ota_list_job_devices_status.process_statuses(job_id, list_payload)
			else:
    				raise BadRequestError("Cannont exceed 20 devices per request")
	else:
            raise BadRequestError("Missing filter parameters")
