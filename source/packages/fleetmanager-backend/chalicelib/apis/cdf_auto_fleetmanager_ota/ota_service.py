# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Create OTA job via CDF Commands using targetQuery to focus
on the vehicles in CDF Asset Library"""

import os
import json
import requests
from requests_aws4auth import AWS4Auth
import boto3
import asyncio
import functools
from datetime import datetime
from elasticsearch import Elasticsearch, RequestsHttpConnection
from chalice import BadRequestError
import logging
import chalicelib.utils.lambda_invoke as _lambda

root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

COMMANDS_FUNCTION_NAME = os.getenv('COMMANDS_FUNCTION_NAME')
COMMANDS_ROUTE = '/commands'
HEADERS = {
  'Accept': 'application/vnd.aws-cdf-v1.0+json',
  'Content-Type': 'application/vnd.aws-cdf-v1.0+json'
}

REGION = os.getenv('REGION')
CREDENTIALS = boto3.Session().get_credentials()
AWSAUTH = AWS4Auth(CREDENTIALS.access_key, CREDENTIALS.secret_key, REGION, 'es', session_token=CREDENTIALS.token)
HOST = os.getenv('ES_ENDPOINT')

IOT_CLIENT = boto3.client('iot')


def json_serial(obj):
    """Utility"""
    if isinstance(obj, (datetime)):
        return obj.timestamp()
    raise Exception("Return data error - datetime")


class CreateOTA:

    @staticmethod
    def _cdf_post_request(payload):
        """POST request for CDF Commands"""
        logger.info("Entering cdf_post_request - %s", payload)

        try:
            cdf_response = _lambda.invoke(
                function=COMMANDS_FUNCTION_NAME,
                path=COMMANDS_ROUTE,
                method='POST',
                headers=HEADERS,
                queryStringParams=None,
                stageVariables=None,
                requestContext=None,
                body=json.dumps(payload)
            )

            logger.info("CDF Commands Status: %s", cdf_response.get('statusCode'))
            return cdf_response

        except Exception as err:
            logger.error("CDF Commands Draft: %s", err)
            raise BadRequestError(err)

    @staticmethod
    def _create_job_draft(filter_data, flag):
        """Receive payload and map -> cdf commands targetQuery"""
        logger.info("Entering create_job_draft")

        if flag == 'multi':
            # OTA for multiple devices/vehicles based on filters
            commands_template = {
                "templateId": "OtaUpdate",
                "documentParameters": {
                    "desiredVersion": filter_data['desiredVersion']
                },
                "targetQuery": {
                    "type": ["auto_ecu"],
                    "eq": []
                },
                "type": "SNAPSHOT"
            }

            temp_traversal = [{
                "relation": "installed_in",
                "direction": "out"
            }]

            try:
                for filter_key, filter_value in filter_data['filters'].items():

                    if filter_key == 'software':
                        if filter_value['swVersion']:
                            sw_dict = dict()
                            print("SW Version: ", filter_value['swVersion'])
                            sw_dict['field'] = 'softwareVersion'
                            sw_dict['value'] = filter_value['swVersion']
                            commands_template['targetQuery']['eq'].append(sw_dict)

                    elif filter_key == 'anomalies':
                        if len(filter_value):
                            anomaly_dict = dict()
                            anomaly_dict['traversals'] = temp_traversal
                            anomaly_dict['field'] = 'anomaly'
                            anomaly_dict['value'] = filter_value[0]
                            commands_template['targetQuery']['eq'].append(anomaly_dict)

                    elif filter_key == 'troubleCodes':
                        if len(filter_value):
                            dtc_dict = dict()
                            dtc_dict['traversals'] = temp_traversal
                            dtc_dict['field'] = 'dtc'
                            dtc_dict['value'] = filter_value[0]
                            commands_template['targetQuery']['eq'].append(dtc_dict)

                    elif filter_key == 'vehicle':

                        if len(filter_value['vin']):
                            vin_dict = dict()
                            vin_dict['traversals'] = temp_traversal
                            vin_dict['field'] = 'name'
                            vin_dict['value'] = filter_value['vin'][0]
                            commands_template['targetQuery']['eq'].append(vin_dict)

                        if len(filter_value['make']):
                            make_dict = dict()
                            make_dict['traversals'] = temp_traversal
                            make_dict['field'] = 'make'
                            make_dict['value'] = filter_value['make'][0]
                            commands_template['targetQuery']['eq'].append(make_dict)

                        if len(filter_value['model']):
                            model_dict = dict()
                            model_dict['traversals'] = temp_traversal
                            model_dict['field'] = 'model'
                            model_dict['value'] = filter_value['model'][0]
                            commands_template['targetQuery']['eq'].append(model_dict)

                        if len(filter_value['year']):
                            year_dict = dict()
                            year_dict['traversals'] = temp_traversal
                            year_dict['field'] = 'modelYear'
                            year_dict['value'] = filter_value['year'][0]
                            commands_template['targetQuery']['eq'].append(year_dict)
            except Exception as err:
                raise BadRequestError(err)
        else:
            # OTA for a single device
            commands_template = {
                "templateId": "OtaUpdate",
                "documentParameters": {
                    "desiredVersion": filter_data['desiredVersion']
                },
                "targets": [filter_data['deviceId'].upper()],
                "type": "SNAPSHOT"
            }

        return CreateOTA._cdf_post_request(commands_template)

    @staticmethod
    def _publish_job(command_id):
        logger.info("Entering publish_job")

        path = COMMANDS_ROUTE + '/' + command_id

        payload = {
            'commandStatus': 'PUBLISHED'
        }

        logger.info("Publish path: %s", path)

        try:
            cdf_response = _lambda.invoke(
                function=COMMANDS_FUNCTION_NAME,
                path=path,
                method='PATCH',
                headers=HEADERS,
                queryStringParams=None,
                stageVariables=None,
                requestContext=None,
                body=json.dumps(payload)
            )
            #cdf_response = requests.patch(url, headers=HEADERS, data=json.dumps(payload))
            logger.info("Publish response: %s", cdf_response.get('text'))
            return cdf_response.get('statusCode')

        except Exception as err:
            logger.error("CDF Commands Publish: %s", err)
            raise BadRequestError(err)

    @staticmethod
    def ota_manager(filter_data, flag):
        """Use incoming filter data to create ota job draft
        and publish it. Return the job_id for further API requests."""

        job_draft_response = CreateOTA._create_job_draft(filter_data, flag)

        if job_draft_response.get('statusCode') == 204:
            command_id = job_draft_response.get('headers')['location'].split("/")[-1]
            publish_response = CreateOTA._publish_job(command_id)

            if publish_response == 204:
                logger.info("Successfully published CDF Job %s", command_id)
                return {'jobId': 'cdf-' + command_id}
            else:
                logger.error("Failed to publish CDF Job: {} - {}".format(command_id, publish_response))
                raise BadRequestError("CDF Job publish error")
        else:
            logger.error("Failed to create CDF Job draft: {}".format(job_draft_response))
            raise BadRequestError(job_draft_response.get('text'))


class OTAJobsList:

    @staticmethod
    def get_jobs(token=None):

        try:
            jobs_response = IOT_CLIENT.list_jobs(
                targetSelection='SNAPSHOT',
                maxResults=50,
                nextToken=token
            )
            logger.info("jobs reponse: %s", jobs_response)

            del jobs_response['ResponseMetadata']

            return json.dumps(jobs_response, default=json_serial)

        except Exception as err:
            logger.error("Get OTA jobs: %s", err)
            raise BadRequestError(err)


class OTAJobDevicesList:

    @staticmethod
    def _add_device_id(data):
        for device_obj in data['executionSummaries']:
            device_id = device_obj['thingArn'].split('/')[-1]
            device_obj['deviceId'] = device_id

        return data

    @staticmethod
    def _create_es_client():
        logger.info("Entering create_es_client")

        url = HOST.split("//")[-1]

        try:
            es_client = Elasticsearch(
                hosts=[{'host': url, 'port': 443}],
                http_auth=AWSAUTH,
                use_ssl=True,
                verify_certs=True,
                connection_class=RequestsHttpConnection
            )

            return es_client

        except Exception as err:
            logger.error("Creating ES client: %s", err)
            raise BadRequestError(err)

    @staticmethod
    def _get_es_data(device_data):
        """Query vehicles from elasticsearch from incoming
        job data to map the vins to each data obj.
        example es query:
        {
        "query": {
                "nested" : {
                    "path" : "devices",
                    "query" : {
                        "terms" : {
                        "devices.deviceid": ["ecu-aws-2014-ycw9v4_uoq", "ecu-aws-2014-z9pl5ae70u"]
                        }

                    }
                }
            }
        }
        """
        logger.info("Entering get_es_data")

        es_client = OTAJobDevicesList._create_es_client()

        es_query = {
                        "size": 10000,
                        "_source": ["devices"],
                        "query": {
                            "nested": {
                                "path": "devices",
                                "query": {
                                    "terms": {
                                        "devices.deviceid": []
                                    }

                                }
                            }
                        }
                    }

        for device_obj in device_data['executionSummaries']:
            device_id = device_obj['thingArn'].split('/')[-1].lower()
            logger.info("device_id: %s", device_id)
            es_query['query']['nested']['query']['terms']['devices.deviceid'].append(device_id)

        logger.info("Final query: %s", es_query)
        try:
            es_response = es_client.search(index='latest_telemetry', body=es_query)
            logger.info("ES response: %s", es_response)

            if 'hits' in es_response:
                if len(es_response['hits']['hits']):
                    return es_response

        except Exception as err:
            logger.error("Searching es: %s", err)
            raise BadRequestError(err)

        return False

    @staticmethod
    def _map_vins(es_data, device_data):
        """map vins to device_ids"""
        logger.info("Entering map_vins")

        if 'hits' in es_data:
            if len(es_data['hits']['hits']):
                # loop through device data
                for device_obj in device_data['executionSummaries']:
                    device_id = device_obj['thingArn'].split('/')[-1].lower()
                    logger.info("device_id: %s", device_id)

                    device_obj['deviceId'] = device_id.upper()

                    # loop through elasticsaerch data
                    for es_obj in es_data['hits']['hits']:

                        # could be multiple devices for vin in elasticsearch
                        for es_device_obj in es_obj['_source']['devices']:
                            logger.info("es_device_obj: %s", es_device_obj)

                            if es_device_obj['deviceid'] == device_id:
                                device_obj['vin'] = es_obj['_id']

                return device_data
            else:
                raise BadRequestError("No elasticsearch data to map to device IDs")
        else:
            raise BadRequestError("Elasticsearch error, no response")

    @staticmethod
    def process_job_devices(job_id, token=None):
        logger.info("Entering process_job_devices")

        try:
            job_devices_response = IOT_CLIENT.list_job_executions_for_job(
                jobId=job_id,
                maxResults=50,
                nextToken=token
            )
            logger.info("job devices response: %s", job_devices_response)

            del job_devices_response['ResponseMetadata']

            es_response = OTAJobDevicesList._get_es_data(job_devices_response)

            if es_response:
                mapped_data = OTAJobDevicesList._map_vins(es_response, job_devices_response)
                return json.dumps(mapped_data, default=json_serial)
            else:
                updated_data = OTAJobDevicesList._add_device_id(job_devices_response)
                return json.dumps(updated_data, default=json_serial)

        except Exception as err:
            logger.error("Get ota job devices: %s", err)
            raise BadRequestError(err)


class OTAJobDevicesStatus:

    @staticmethod
    async def get_devices_status(job_id, device_list):
        logger.info("Entering get_devices_status")
        loop = asyncio.get_running_loop()

        try:
            executions = await asyncio.gather(
                *[
                    loop.run_in_executor(None, functools.partial(
                        IOT_CLIENT.describe_job_execution,
                        jobId=job_id,
                        thingName=thing.upper()
                        )
                    )
                    for thing in device_list
                ]
            )

            return executions
        except Exception as err:
            raise BadRequestError(err)

    @staticmethod
    def process_statuses(job_id, device_list):
        logger.info("Entering process_statuses")

        loop = asyncio.get_event_loop()
        raw = loop.run_until_complete(OTAJobDevicesStatus.get_devices_status(job_id, device_list))
        formatted_list = list()

        for status_obj in raw:
            status_obj['execution']['deviceId'] = status_obj['execution']['thingArn'].split('/')[-1]
            obj = {'execution': status_obj['execution']}
            formatted_list.append(obj)

        response = json.dumps(formatted_list, default=json_serial)
        return response
