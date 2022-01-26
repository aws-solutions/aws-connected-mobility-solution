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
  DATA_SET_OTA_JOBS_LIST,
  DATA_SET_SELECTED_VEHICLE,
  DATA_SET_TRIP_EVENT,
  DATA_SET_VEHICLE_LIST,
  DATA_SET_PREVIOUS_LOCATIONS,
  DATA_SET_MAP_CLUSTERS,
  DATA_SET_MAP_VEHICLES
} from "actions/types";

const defaultState = {
  otaJobsList: {
    jobs: [],
    nextToken: null
  },
  vehicleList: {
    vehicles: [],
    offset: null,
    vehicleCount: 0,
    filters: null
  },
  mapVehicles: [],
  mapClusters: [],
  selectedVehicleData: null,
  tripEventData: null,
  prevLocations: {}
};

const dataReducer = (state = defaultState, action) => {
  switch (action.type) {
    case DATA_SET_OTA_JOBS_LIST:
      return {
        ...state,
        otaJobsList: action.payload
      };
    case DATA_SET_SELECTED_VEHICLE:
      return {
        ...state,
        selectedVehicleData: action.payload
      };
    case DATA_SET_TRIP_EVENT:
      return {
        ...state,
        tripEventData: action.payload
      };
    case DATA_SET_VEHICLE_LIST:
      return {
        ...state,
        vehicleList: action.payload
      };
    case DATA_SET_MAP_CLUSTERS:
      return {
        ...state,
        mapClusters: action.payload
      };
    case DATA_SET_MAP_VEHICLES:
      return {
        ...state,
        mapVehicles: action.payload
      };
    case DATA_SET_PREVIOUS_LOCATIONS:
      return { ...state, prevLocations: action.payload };
    default:
      return state;
  }
};

export default dataReducer;
