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
"""Cloudformation util lambda. After Elasticsearch domain has been created,
this will created the necessary indexes and mappings"""

import os
import json
import boto3
import requests
from requests_aws4auth import AWS4Auth
from elasticsearch import Elasticsearch, RequestsHttpConnection
from crhelper import CfnResource
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))

REGION = os.getenv('REGION')
CREDENTIALS = boto3.Session().get_credentials()
AWSAUTH = AWS4Auth(CREDENTIALS.access_key, CREDENTIALS.secret_key, REGION, 'es', session_token=CREDENTIALS.token)
HEADERS = {"Content-Type": "application/json"}
HOST = os.getenv('ES_ENDPOINT')

try:
    helper = CfnResource()
except Exception as e:
    helper.init_failure(e)


def create_es_client():
    logger.info("Entering create_es_client")

    try:
        es_client = Elasticsearch(
            hosts=[{'host': HOST, 'port': 443}],
            http_auth=AWSAUTH,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection
        )

        return es_client

    except Exception as err:
        logger.error("ES client error: %s", err)


@helper.create
def create_indexes(event, _):
    """create all indexes from json file"""

    client = create_es_client()

    try:
        with open('elasticsearch_index_mapper.json', 'r') as index_mapper:
            data = json.load(index_mapper)

            for index_key, index_value in data.items():
                logger.info("Indexing: %s", index_key)
                resp = client.indices.create(index=index_key, ignore=400, body=index_value)
                logger.info(resp)

    except Exception as err:
        logger.error("Failed to map elasticsearch indexes: %s", err)


@helper.delete
def no_op(_, __):
    pass


def lambda_handler(event, context):
    try:
        helper(event, context)
    except Exception as error:
        logger.error(error)
        helper.init_failure("Failing Gracefully...")
