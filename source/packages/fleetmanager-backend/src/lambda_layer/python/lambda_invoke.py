# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# This source code is subject to the terms found in the AWS Enterprise
# Customer Agreement.

import boto3
import json
import logging
root = logging.getLogger()
root.setLevel('INFO')
logger = logging.getLogger()
if logger.handlers:
    HANDLER = logger.handlers[0]
    HANDLER.setFormatter(logging.Formatter("%(message)s"))


def buildPayload(path, method, headers, queryStringParams, stageVariables, requestContext, body):
    """Build a json payload using required fields.
    Convert to class if needed"""

    pathParams = json.dumps({
      'proxy': path.strip('/')
    })

    payload = {
        'resource': '/{proxy+}',
        'path': path,
        'httpMethod': method,
        'headers': headers,
        'queryStringParameters': queryStringParams,
        'pathParameters': pathParams,
        'stageVariables': stageVariables,
        'requestContext': requestContext,
        'body': body
    }

    payloadStr = json.dumps(payload)

    logger.info("Using payload {}".format(payloadStr))

    return payloadStr


def invoke(function, path, method, headers, queryStringParams, stageVariables, requestContext, body):
    """Invoke the lambda using parameters provided"""

    lambdaclient = boto3.client('lambda')

    try:
        logger.info("Invoking Lambda {}".format(function))

        response = lambdaclient.invoke(
          FunctionName=function,
          InvocationType='RequestResponse',
          LogType='Tail',
          Payload=buildPayload(path, method, headers, queryStringParams, stageVariables, requestContext, body)
        )

        responseBodyStr = json.loads(response['Payload'].read())
        return responseBodyStr

    except Exception as e:
        logger.error("lambdaInvoke: Exception = {}".format(str(e)))

    return {}
