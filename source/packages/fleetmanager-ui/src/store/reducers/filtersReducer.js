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
import {
  FILTERS_UPDATE_SINGLE_FILTER,
  FILTERS_UPDATE_MULTIPLE_FILTERS
} from "actions/types";

export const defaultState = {
  anomalies: {
    options: []
  },
  troubleCodes: {
    options: []
  },
  location: {
    options: []
  },
  vehicle: {
    vin: { options: [] },
    make: { options: [] },
    model: { options: [] },
    year: { options: [] }
  },
  software: {
    version: { options: [] }
  }
};

export const defaultAnomaliesTroubleCodes = {
  anomalies: defaultState.anomalies,
  troubleCodes: defaultState.troubleCodes
};

const filtersReducer = (state = defaultState, { type, payload, keyName }) => {
  switch (type) {
    case FILTERS_UPDATE_SINGLE_FILTER:
      return {
        ...state,
        [keyName]: payload
      };
    case FILTERS_UPDATE_MULTIPLE_FILTERS:
      return {
        ...state,
        ...payload
      };
    default:
      return state;
  }
};

export default filtersReducer;
