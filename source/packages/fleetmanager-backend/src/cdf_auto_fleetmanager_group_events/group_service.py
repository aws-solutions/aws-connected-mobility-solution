# --------------------------------------------------------------------------------
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.
# ---------------------------------------------------------------------------------
"""Ingest data from IoT rule for Groups topic:
    cdf/assetlibrary/events/groups/# --> elasticsearch."""

import os
import json
import urllib
from cdf_auto_fleetmanager_util import CDFAutoUtils
import lambda_invoke as _lambda
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

HEADERS = {"Content-Type": "application/json"}
ASSET_HEADERS = {
    'Content-Type': 'application/vnd.aws-cdf-v2.0+json',
    'Accept': 'application/vnd.aws-cdf-v2.0+json'
}
ASSET_LIBRARY_FUNCTION_NAME = os.getenv('ASSET_LIBRARY_FUNCTION_NAME')

"""
Incoming service set
- Get all individual services for the set
- Get all remote commands for each service within the service set
- Map final object
- Send to append/update/remove to vehicle data in ES index
"""


class GroupService:

    @staticmethod
    def _build_serviceset_add_query(vin, payload):
        """build elasicsearch query specific
        for adding a service set group"""

        logger.info("Entering _build_serviceset_add_query")

        query = {
            "script": {
                "lang": "painless",
                "source": "if(ctx._source.service_set == null) {ctx._source['service_set'] = [params.object]}else{ctx._source['service_set'].add(params.object)}",
                "params": {
                    "object": payload
                }
            },
            "query": {
                "query_string": {
                    "query": vin
                }
            }
        }

        return query

    @staticmethod
    def _build_serviceset_delete_query(vin, payload):
        """build elasicsearch query specific
        for removing a service set group."""

        logger.info("Entering _build_serviceset_delete_query")

        query = {
            "script": {
                "lang": "painless",
                "source": "ctx._source.service_set.removeIf(list_item -> list_item.id == params.remove_id);",
                "params": {
                    "remove_id": payload['id']
                }
            },
            "query": {
                "query_string": {
                    "query": vin
                }
            }
        }

        return query

    @staticmethod
    def add_new_service_set(vin, payload):
        logger.info("Entering add_new_service_set")

        url = CDFAutoUtils.url_builder('shared_cardata', '_update_by_query?conflicts=proceed&refresh=true')
        query = GroupService._build_serviceset_add_query(vin, payload)
        logger.info("Final url: {} and query: {}".format(url, query))

        CDFAutoUtils.es_add_update(url, query)

    @staticmethod
    def remove_service_set(vin, payload):
        logger.info("Entering remove_service_set")

        url = CDFAutoUtils.url_builder('shared_cardata', '_update_by_query?conflicts=proceed&refresh=true')
        query = GroupService._build_serviceset_delete_query(vin, payload)
        logger.info("Final url: {} and query: {}".format(url, query))

        CDFAutoUtils.es_add_update(url, query)

    @staticmethod
    def update_service_set(vin, payload):
        """updating sensor in a list of devices means
        removing the existing (per deviceid) and adding
        the new version to the list"""
        logger.info("Entering update_sensor")

        # 1st remove current service set from list
        logger.info("1st remove existing service set...")
        GroupService.remove_service_set(vin, payload)

        # 2nd add new service set to list
        logger.info("2nd add the updated service set...")
        GroupService.add_new_service_set(vin, payload)


class RemoteCommandControl:
    """Business logic for vehicle remote commands"""

    @staticmethod
    def cdf_remote_command_data(group_path):
        """remote control data from cdf asset library
        {
            "attributes": {
                "command": "honk",
                "states": "honk"
            },
            "category": "group",
            "templateId": "remote_control_command",
            "parentPath": "/remotecommands",
            "name": "horn",
            "groupPath": "/remotecommands/horn-01",
            "relation": "command_for",
            "direction": "in"
        }
        """
        logger.info("Entering cdf_remote_command_data")

        # {{assetlibrary_base_url}}/groups/%2fservices%2fhorn/members/groups

        group_encoding = urllib.parse.quote(group_path, safe='')
        path = '/groups/' + group_encoding + '/members/groups'

        logger.info("query path: {}".format(path))

        try:
            cdf_response = _lambda.invoke(
                function=ASSET_LIBRARY_FUNCTION_NAME,
                path=path,
                method='GET',
                headers=HEADERS,
                queryStringParams=None,
                stageVariables=None,
                requestContext=None,
                body=None
            )

            logger.info("CDF Asset Library Status: %s", cdf_response.get('statusCode'))

            if cdf_response.get('statusCode') == 200:
                json_data = json.loads(cdf_response['body'])
                logger.info("json_data: {}".format(json_data))

                # loop through to fetch only remote command object
                for group in json_data['results']:
                    if group['parentPath'] == '/remotecommands':
                        return group['attributes']

        except Exception as err:
            logger.error("Asset Library Error: {}".format(err))
