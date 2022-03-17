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
import { DATA_SET_DASHBOARD } from "actions/types";

export const defaultState = {
  tirePressureData: {
    page: 0,
    count: 0,
    rowsPerPage: 10,
    sortOrder: {},
    data: [],
    isLoading: false,
  },
  lowBatteryData: {
    page: 0,
    count: 0,
    rowsPerPage: 10,
    sortOrder: {},
    data: [],
    isLoading: false,
  },
  notChargingData: {
    page: 0,
    count: 0,
    rowsPerPage: 10,
    sortOrder: {},
    data: [],
    isLoading: false,
  },
  efficiencyData: {
    page: 0,
    count: 0,
    rowsPerPage: 10,
    sortOrder: {},
    data: [],
    isLoading: false,
  },
  highLowData: {
    page: 0,
    count: 0,
    rowsPerPage: 10,
    sortOrder: {},
    data: [],
    isLoading: false,
  },
  lastUpdated: "",
};

const dashboardDataReducer = (
  state = defaultState,
  { type, payload, keyName }
) => {
  switch (type) {
    case DATA_SET_DASHBOARD:
      return {
        ...state,
        [keyName]: payload,
      };
    default:
      return state;
  }
};

export default dashboardDataReducer;
