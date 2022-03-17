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
import { DATA_SET_DASHBOARD } from "./types";
import {
  getTirePressureData,
  getBatteryData,
  getNotChargingData,
  getEfficiencyData,
} from "apis/dashboard";
import {
  BATTERY,
  EFFICIENCY,
  TIRES,
  CHARGING,
} from "./../components/dashboard/tables/tableTypes";
import { clearAllFilters } from "./dashboardFiltersActions";
import moment from "moment";

export const setSingleData = (keyName, payload) => ({
  type: DATA_SET_DASHBOARD,
  payload,
  keyName,
});

export const getTireTableData = (type, page) => {
  return (dispatch, getState) => {
    const { dashboardData, dashboardFilters } = getState();
    dispatch(setSingleData(type, { ...dashboardData[type], isLoading: true }));
    const newFilters = {
      ...dashboardFilters,
      last_seen_offset: page === undefined ? dashboardData[type].page : page,
      pagination_count: dashboardData[type].rowsPerPage,
    };
    getTirePressureData(newFilters)
      .then((result) => {
        result.data.forEach((c) => (c.isChecked = false));
        const newData = {
          ...dashboardData[type],
          data: result.data,
          isLoading: false,
          count: result.total_count,
          page: page === undefined ? 0 : page,
        };
        dispatch(setSingleData(type, newData));
      })
      .catch((error) => {
        console.log("error", error);
        dispatch(
          setSingleData(type, { ...dashboardData[type], isLoading: false })
        );
      });
  };
};

export const getBatteryTableData = (type, page) => {
  return (dispatch, getState) => {
    const { dashboardData, dashboardFilters } = getState();
    dispatch(setSingleData(type, { ...dashboardData[type], isLoading: true }));
    const newFilters = {
      ...dashboardFilters,
      last_seen_offset: page === undefined ? dashboardData[type].page : page,
      pagination_count: dashboardData[type].rowsPerPage,
    };
    getBatteryData(newFilters)
      .then((result) => {
        result.data.forEach((c) => (c.isChecked = false));
        const newData = {
          ...dashboardData[type],
          data: result.data,
          isLoading: false,
          count: result.total_count,
          page: page === undefined ? 0 : page,
        };
        dispatch(setSingleData(type, newData));
      })
      .catch((error) => {
        console.log("error", error);
        dispatch(
          setSingleData(type, { ...dashboardData[type], isLoading: false })
        );
      });
  };
};

export const getNotChargingTableData = (type, page) => {
  return (dispatch, getState) => {
    const { dashboardData, dashboardFilters } = getState();
    dispatch(setSingleData(type, { ...dashboardData[type], isLoading: true }));
    const newFilters = {
      ...dashboardFilters,
      last_seen_offset: page === undefined ? dashboardData[type].page : page,
      pagination_count: dashboardData[type].rowsPerPage,
    };
    getNotChargingData(newFilters)
      .then((result) => {
        result.data.forEach((c) => (c.isChecked = false));
        const newData = {
          ...dashboardData[type],
          data: result.data,
          isLoading: false,
          count: result.total_count,
          page: page === undefined ? 0 : page,
        };
        dispatch(setSingleData(type, newData));
      })
      .catch((error) => {
        console.log("error", error);
        dispatch(
          setSingleData(type, { ...dashboardData[type], isLoading: false })
        );
      });
  };
};

export const getEfficencyTableData = (type, page) => {
  return (dispatch, getState) => {
    const { dashboardData, dashboardFilters } = getState();
    dispatch(setSingleData(type, { ...dashboardData[type], isLoading: true }));
    const newFilters = {
      ...dashboardFilters,
      last_seen_offset: page === undefined ? dashboardData[type].page : page,
      pagination_count: dashboardData[type].rowsPerPage,
    };
    getEfficiencyData(newFilters)
      .then((result) => {
        result.data.forEach((c) => (c.isChecked = false));
        const newData = {
          ...dashboardData[type],
          data: result.data,
          isLoading: false,
          count: result.total_count,
          page: page === undefined ? 0 : page,
        };
        dispatch(setSingleData(type, newData));
      })
      .catch((error) => {
        console.log("error", error);
        dispatch(
          setSingleData(type, { ...dashboardData[type], isLoading: false })
        );
      });
  };
};

export const clearAllFiltersRefreshData = () => {
  return (dispatch) => {
    dispatch(clearAllFilters());
    dispatch(getTireTableData(TIRES));
    dispatch(getBatteryTableData(BATTERY));
    dispatch(getNotChargingTableData(CHARGING));
    dispatch(getEfficencyTableData(EFFICIENCY));
  };
};

export const setLastUpdated = () => {
  return (dispatch) => {
    const time = moment().format("MMMM Do YYYY, h:mm:ss a");
    dispatch(setSingleData("lastUpdated", time));
  };
};

export const getAllTablesData = ({ forceUpdate }) => {
  return (dispatch, getState) => {
    const { dashboardData } = getState();
    const tireLength = dashboardData[TIRES].data.length;
    const batteryLength = dashboardData[BATTERY].data.length;
    const chargingLength = dashboardData[CHARGING].data.length;
    const efficiencyLength = dashboardData[EFFICIENCY].data.length;
    if (
      !tireLength ||
      !batteryLength ||
      !chargingLength ||
      !efficiencyLength ||
      forceUpdate
    ) {
      dispatch(getTireTableData(TIRES));
      dispatch(getBatteryTableData(BATTERY));
      dispatch(getNotChargingTableData(CHARGING));
      dispatch(getEfficencyTableData(EFFICIENCY));
      dispatch(setLastUpdated());
    }
  };
};
