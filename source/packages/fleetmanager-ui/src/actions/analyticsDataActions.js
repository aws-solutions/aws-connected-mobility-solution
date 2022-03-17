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
import { DATA_SET_ANALYTICS } from "./types";
import { getAnalyticsData } from "apis/analytics";
import moment from "moment";

export const setSingleData = (payload) => ({
  type: DATA_SET_ANALYTICS,
  payload,
});

export const fetchAnalyticsData = () => {
  return (dispatch) => {
    getAnalyticsData()
      .then((result) => {
        const res = result.data;
        let economyArr = [];
        let occurancesArr = [];
        let distanceArr = [];

        res.forEach((obj) => {
          const economyObj = {
            week: obj.week,
            q1: Math.round(obj.q1),
            median: Math.round(obj.median),
            average: Math.round(obj.average),
            q3: Math.round(obj.q3),
          };
          const occurancesObj = {
            week: obj.week,
            occurences: obj.occurences,
          };
          const distanceObj = {
            week: obj.week,
            distance_average: Math.round(obj.distance_average),
            tp90: Math.round(obj.tp90),
          };
          economyArr.push(economyObj);
          occurancesArr.push(occurancesObj);
          distanceArr.push(distanceObj);
        });
        dispatch(
          setSingleData({
            energyEconomy: economyArr,
            occurances: occurancesArr,
            distanceTraveled: distanceArr,
            lastUpdated: moment().format("MMMM Do YYYY, h:mm:ss a"),
          })
        );
      })
      .catch((error) => console.log("error", error));
  };
};

// export const fetchEnergyEconomyData = () => {
//   return (dispatch) => {
//     getEnergyEconomyData()
//       .then((result) => {
//         dispatch(setSingleData("energyEconomy", result.data.data));
//       })
//       .catch((error) => console.log("error", error));
//   };
// };

// export const fetchOccuranceData = () => {
//   return (dispatch) => {
//     getOccurancesData()
//       .then((result) => {
//         dispatch(setSingleData("occurances", result.data.data));
//       })
//       .catch((error) => console.log("error", error));
//   };
// };

// export const fetchDistanceTraveledData = () => {
//   return (dispatch) => {
//     getDistanceTraveledData()
//       .then((result) => {
//         dispatch(setSingleData("distanceTraveled", result.data.data));
//       })
//       .catch((error) => console.log("error", error));
//   };
// };

// export const getAllAnalyticsData = () => {
//   return (dispatch, getState) => {
//     const { analyticsData } = getState();
//     const energyLength = analyticsData["energyEconomy"].length;
//     const occurancesLength = analyticsData["occurances"].length;
//     const distanceLength = analyticsData["distanceTraveled"].length;
//     if (!energyLength || !occurancesLength || !distanceLength) {
//       dispatch(fetchEnergyEconomyData());
//       dispatch(fetchOccuranceData());
//       dispatch(fetchDistanceTraveledData());
//     }
//   };
// };
