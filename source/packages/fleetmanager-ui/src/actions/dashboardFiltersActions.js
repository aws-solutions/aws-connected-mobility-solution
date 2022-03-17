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
  mergeFilterSelections,
  clearCheckboxSelections,
} from "utils/filterHelpers";
import { defaultState as defaultFilters } from "store/reducers/dashboardFiltersReducer";
import {
  DASHBOARD_FILTERS_UPDATE_SINGLE_FILTER,
  DASHBOARD_FILTERS_UPDATE_MULTIPLE_FILTERS,
} from "./types";

export const setSingleFilter = ({ keyName, payload }) => ({
  type: DASHBOARD_FILTERS_UPDATE_SINGLE_FILTER,
  payload,
  keyName,
});

export const setMultipleFilters = (payload) => ({
  type: DASHBOARD_FILTERS_UPDATE_MULTIPLE_FILTERS,
  payload,
});

export const setUpdatedFilters = ({
  anomalies = [],
  troubleCodes = [],
} = {}) => {
  return (dispatch, getState) => {
    const {
      filters: { anomalies: prevAnomalies, troubleCodes: prevTroubleCodes },
    } = getState();

    const filtersWithSelections = {
      anomalies: {
        ...prevAnomalies,
        options: mergeFilterSelections(anomalies, prevAnomalies.options),
      },
      troubleCodes: {
        ...prevTroubleCodes,
        options: mergeFilterSelections(troubleCodes, prevTroubleCodes.options),
      },
    };

    dispatch(setMultipleFilters(filtersWithSelections));
  };
};

const resetCheckboxOptions = ({ keyName, currFilterData }) => {
  const resetOptions = clearCheckboxSelections(currFilterData.options);
  const payload = {
    ...currFilterData,
    options: resetOptions,
  };
  return setSingleFilter({ keyName, payload });
};

export const resetFilterByKeyName = (keyName) => {
  return (dispatch, getState) => {
    const currFilterData = getState().filters[keyName];

    switch (keyName) {
      case "anomalies":
      case "troubleCodes":
        return dispatch(resetCheckboxOptions({ keyName, currFilterData }));
      default:
        const payload = defaultFilters[keyName];
        if (payload) dispatch(setSingleFilter({ keyName, payload }));
        break;
    }
  };
};

export const updatePressureFilters = (keyname) => {
  return (dispatch, getState) => {
    const {
      dashboardFilters: { pressure },
    } = getState();

    const updatedFilters = {
      ...defaultFilters,
      pressure: {
        ...pressure,
        [keyname]: !pressure[keyname],
      },
    };

    dispatch(
      setSingleFilter({ keyName: "pressure", payload: updatedFilters.pressure })
    );
  };
};

export const updateIgnitionFilters = (keyname) => {
  return (dispatch, getState) => {
    const {
      dashboardFilters: { ignition },
    } = getState();

    const updatedFilters = {
      ...defaultFilters,
      ignition: {
        ...ignition,
        [keyname]: !ignition[keyname],
      },
    };

    dispatch(
      setSingleFilter({ keyName: "ignition", payload: updatedFilters.ignition })
    );
  };
};

export const clearPressureFilters = () => {
  return (dispatch, getState) => {
    const resetFilters = {
      lowPressure: false,
      highRoC: false,
    };

    dispatch(setSingleFilter({ keyName: "pressure", payload: resetFilters }));
  };
};

export const clearAllFilters = () => {
  return (dispatch, getState) => {
    dispatch(setMultipleFilters(defaultFilters));
  };
};
