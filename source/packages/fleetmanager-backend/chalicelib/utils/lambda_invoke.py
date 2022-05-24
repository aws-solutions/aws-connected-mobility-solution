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
# Copyright (c) 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# This source code is subject to the terms found in the AWS Enterprise Customer Agreement.

import boto3
import json


def buildPayload(path, method, headers, queryStringParams, stageVariables, requestContext, body):
  """
  Build a json payload using required fields. Convert to class if needed
  """

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

  print("Using payload {}".format(payloadStr))

  return payloadStr


def invoke(function, path, method, headers, queryStringParams, stageVariables, requestContext, body):
  """
  Invoke the lambda using parameters provided
  """

  lambdaclient = boto3.client('lambda')

  try:
    print("Invoking Lambda {}".format(function))

    response=lambdaclient.invoke(
      FunctionName=function,
      InvocationType='RequestResponse',
      LogType='Tail',
      Payload= buildPayload(path, method, headers, queryStringParams, stageVariables, requestContext, body)
    )

    #print("Lambda response: {}".format(response))
    responseBodyStr = json.loads(response['Payload'].read())
    #print("Lambda body response: {}".format(responseBodyStr))
    return responseBodyStr

  except Exception as e:
    print("lambdaInvoke: Exception = {}".format(str(e)))


  return {}
