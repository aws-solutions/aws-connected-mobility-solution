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
  VIEWS_SET_RIGHT_SIDEBAR_OPEN,
  VIEWS_SET_OTA_SIDEBAR_OPEN,
  VIEWS_SET_SINGLE_VEHICLE_VIEW,
  VIEWS_SET_TRIP_EVENT_VIEW,
  VIEWS_SET_FILTER_ID_OPEN,
  VIEWS_SET_JOB_ID_OPEN
} from "./types";
import { refreshVehicles, setPreviousLocations } from "actions/dataActions";

export const setOtaSidebarOpen = isOpen => {
  return dispatch => {
    dispatch({
      type: VIEWS_SET_OTA_SIDEBAR_OPEN,
      payload: isOpen
    });

    if (isOpen === false)
      setTimeout(() => dispatch(refreshVehicles({ source: "otaClose" })), 100);
  };
};

export const toggleRightSidebar = () => {
  return (dispatch, getState) => {
    const {
      views: { rightSidebarOpen }
    } = getState();

    dispatch(setRightSideBarOpen(!rightSidebarOpen));
  };
};

export const setRightSideBarOpen = isOpen => ({
  type: VIEWS_SET_RIGHT_SIDEBAR_OPEN,
  payload: isOpen
});

export const setSingleVehicleView = isOpen => ({
  type: VIEWS_SET_SINGLE_VEHICLE_VIEW,
  payload: isOpen
});

export const setSingleVehicleViewOpen = () => {
  return dispatch => {
    dispatch(setSingleVehicleView(true));
    dispatch(setRightSideBarOpen(true));
  };
};

export const setTripHistoryView = isOpen => {
  return dispatch => {
    dispatch({
      type: VIEWS_SET_TRIP_EVENT_VIEW,
      payload: isOpen
    });

    if (isOpen) dispatch(setPreviousLocations({}));
  };
};

export const setFilterIdOpen = isOpen => ({
  type: VIEWS_SET_FILTER_ID_OPEN,
  payload: isOpen
});

export const toggleFilterIdOpen = filterName => {
  return (dispatch, getState) => {
    const {
      views: { filterIdOpen }
    } = getState();

    const filterIsOpen = filterName === filterIdOpen;

    if (filterIsOpen) {
      dispatch(setFilterIdOpen(null));
    } else {
      dispatch(setFilterIdOpen(filterName));
    }
  };
};

export const setJobIdOpen = jobId => ({
  type: VIEWS_SET_JOB_ID_OPEN,
  payload: jobId
});

export const toggleJobIdOpen = jobId => {
  return (dispatch, getState) => {
    const {
      views: { jobIdOpen }
    } = getState();

    const jobIsOpen = jobId === jobIdOpen;

    if (jobIsOpen) {
      dispatch(setJobIdOpen(null));
    } else {
      dispatch(setJobIdOpen(jobId));
    }
  };
};
