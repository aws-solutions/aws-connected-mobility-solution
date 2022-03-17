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
  UPDATE_TABLE_SETTING,
  RESET_TABLE_SETTING,
  UPDATE_MULTIPLE_TABLE_SETTINGS,
} from "actions/types";

export const defaultState = {
  tirePressure: "30",
  tempTirePressure: "30",
  roc: "4",
  tempRoc: "4",
  battery: "20",
  tempBattery: "20",
  charging: "30",
  tempCharging: "30",
  efficiency: "40",
  tempEfficiency: "40",
};

const tableSettingsReducer = (
  state = defaultState,
  { type, payload, keyName, keyName2 }
) => {
  switch (type) {
    case UPDATE_TABLE_SETTING:
      return {
        ...state,
        [keyName]: payload,
      };
    case UPDATE_MULTIPLE_TABLE_SETTINGS:
      return {
        ...state,
        [keyName]: payload[keyName],
        [keyName2]: payload[keyName2],
      };
    case RESET_TABLE_SETTING:
      return {
        ...state,
        [keyName]: defaultState[keyName],
      };
    default:
      return state;
  }
};

export default tableSettingsReducer;
