/*********************************************************************************************************************
 *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
import { API } from "aws-amplify";
import { CDF_AUTO } from "apis/_NAMES";

const BASE_PATH = `/ota`;

export const createJobFromFilters = ({ desiredVersion, filters }) =>
  API.post(CDF_AUTO, `${BASE_PATH}/create`, {
    body: { desiredVersion, filters }
  });

export const createJobForVehicle = ({ desiredVersion, deviceId }) =>
  API.post(CDF_AUTO, `${BASE_PATH}/create/${deviceId}`, {
    body: { desiredVersion }
  });

export const listJobsPaginated = ({ nextToken }) =>
  API.get(CDF_AUTO, BASE_PATH, {
    queryStringParameters: nextToken ? { nextToken } : {}
  });

export const listJobExecutionsPaginated = ({ jobId, nextToken }) =>
  API.get(CDF_AUTO, `${BASE_PATH}/${jobId}/devices`, {
    queryStringParameters: nextToken ? { nextToken } : {}
  });

export const getDeviceJobExecutions = async ({ jobId, deviceIds = [] }) =>
  API.get(CDF_AUTO, `${BASE_PATH}/${jobId}/devices/status`, {
    queryStringParameters: {
      filters: deviceIds.join(",")
    }
  });
