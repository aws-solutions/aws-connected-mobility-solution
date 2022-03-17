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
import update from "immutability-helper";
import { filterComponents } from "components/filters/Filters";
import { filterComponents as dashboardFilterComponents } from "components/filters/DashboardFilters";

export const mergeFilterSelections = (newOptions = [], prevOptions = []) => {
  const prevSelectedIdMap = prevOptions.reduce((map, { id, selected }) => {
    map[id] = selected;
    return map;
  }, {});

  const newOptionsIdMap = {};
  const updatedNewOptions = newOptions.map(({ id, ...other }) => {
    newOptionsIdMap[id] = true;
    const selected = prevSelectedIdMap[id] || false;
    return { id, ...other, selected };
  });

  const unmatchedPrevOptions = prevOptions
    .filter(({ id }) => !newOptionsIdMap[id])
    .map((option) => ({ ...option, count: 0 }));

  return updatedNewOptions.concat(unmatchedPrevOptions);
};

export const buildOptionUpdatePayload = ({ filterData, optionIdx, selected }) =>
  update(filterData, {
    options: {
      [optionIdx]: {
        $merge: {
          selected,
        },
      },
    },
  });

export const newUniqueLocation = (newLoc = {}, currLocations = []) =>
  currLocations.every(({ id }) => id !== newLoc.id);

export const buildIsFilteringMap = (filters = {}, type) => {
  if (type) {
    return dashboardFilterComponents.reduce(
      (map, { keyName, isFilteringFunc }) => {
        const filterData = filters[keyName];
        const isFiltering = isFilteringFunc(filterData);
        map[keyName] = isFiltering;
        return map;
      },
      {}
    );
  } else {
    return filterComponents.reduce((map, { keyName, isFilteringFunc }) => {
      const filterData = filters[keyName];
      const isFiltering = isFilteringFunc(filterData);
      map[keyName] = isFiltering;
      return map;
    }, {});
  }
};

export const clearCheckboxSelections = (options = []) =>
  options.map((op) => ({
    ...op,
    selected: false,
  }));

export const getApplyingMultFilters = (filters = {}) =>
  !filterComponents.every(
    ({ selectedMultipleFiltersFunc, keyName }) =>
      !selectedMultipleFiltersFunc(filters[keyName])
  );
