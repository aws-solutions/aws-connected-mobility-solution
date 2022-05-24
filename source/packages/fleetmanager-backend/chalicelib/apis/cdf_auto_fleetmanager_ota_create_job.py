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
"""Create OTA job via CDF Commands using targetQuery to focus
on the vehicles in CDF Asset Library"""
import os
import json
import requests
from chalice import BadRequestError, NotFoundError, ChaliceViewError
import logging

import chalicelib.utils.lambda_invoke as _lambda

root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

COMMANDS_URL = os.getenv('COMMANDS_URL')
COMMANDS_FUNCTION_NAME = os.getenv('COMMANDS_FUNCTION_NAME')
COMMANDS_ROUTE = '/commands'
BASEPATH = COMMANDS_URL + COMMANDS_ROUTE
HEADERS = {
  'Accept': 'application/vnd.aws-cdf-v1.0+json',
  'Content-Type': 'application/vnd.aws-cdf-v1.0+json'
}


def cdf_post_request(payload):
    """POST request for CDF Commands"""
    logger.info("Entering cdf_post_request - %s", payload)
    logger.info("BASEPATH: %s", BASEPATH)

    try:
        cdf_response = _lambda.invoke(
            function=COMMANDS_FUNCTION_NAME,
            path=COMMANDS_ROUTE,
            method='POST',
            headers=HEADERS,
            queryStringParams=None,
            stageVariables=None,
            requestContext=None,
            body = json.dumps(payload)
        )

        #cdf_response = requests.post(BASEPATH, headers=HEADERS, data=json.dumps(payload))
        logger.info("CDF Commands Status: %s", cdf_response.get('statusCode'))
        return cdf_response

    except Exception as err:
        logger.error("CDF Commands Draft: %s", err)
        raise ChaliceViewError(err)


def create_job_draft(filter_data, flag):
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
            raise ChaliceViewError(err)
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

    return cdf_post_request(commands_template)


def publish_job(command_id):
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
            body = json.dumps(payload)
        )
        #cdf_response = requests.patch(url, headers=HEADERS, data=json.dumps(payload))
        logger.info("Publish response: %s", cdf_response.get('text'))
        return cdf_response.get('statusCode')
    except Exception as err:
        logger.error("CDF Commands Publish: %s", err)
        raise ChaliceViewError(err)


def main(filter_data, flag):
    """Use incoming filter data to create ota job draft
    and publish it. Return the job_id for further API requests."""

    job_draft_response = create_job_draft(filter_data, flag)

    if job_draft_response.get('statusCode') == 204:
        command_id = job_draft_response.get(
            'headers')['location'].split("/")[-1]
        publish_response = publish_job(command_id)

        if publish_response == 204:
            logger.info("Successfully published CDF Job %s", command_id)
            return {'jobId': 'cdf-' + command_id}
        else:
            logger.error("Failed to publish CDF Job %s - %o",
                         command_id, publish_response)
            raise ChaliceViewError("CDF Job publish error")
    else:
        logger.error("Failed to create CDF Job draft %s", job_draft_response)
        raise ChaliceViewError(job_draft_response.get('text'))
