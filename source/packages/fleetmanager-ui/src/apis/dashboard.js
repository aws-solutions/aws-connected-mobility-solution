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

const BASE_PATH = `/dashboard`;

export const getTirePressureData = (data) =>
  API.post(CDF_AUTO, `${BASE_PATH}/tirepressure`, {
    body: { filters: { ...data } },
  });

export const getBatteryData = (data) =>
  API.post(CDF_AUTO, `${BASE_PATH}/battery`, {
    body: { filters: { ...data } },
  });

export const getNotChargingData = (data) =>
  API.post(CDF_AUTO, `${BASE_PATH}/notcharging`, {
    body: { filters: { ...data } },
  });

export const getEfficiencyData = (data) =>
  API.post(CDF_AUTO, `${BASE_PATH}/efficency`, {
    body: { filters: { ...data } },
  });
