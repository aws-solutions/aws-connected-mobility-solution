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
import React from "react";
import PropTypes from "prop-types";
import FilterCheckbox from "./FilterCheckbox";
import { buildOptionUpdatePayload } from "utils/filterHelpers";

const CheckboxGroup = ({ filterData, updateFilter, keyName }) => {
  const { options = [] } = filterData;
  const isDtc = keyName === "troubleCodes";
  const isAnomaly = keyName === "anomalies";

  const handleFilterChange = (selected, optionIdx) => {
    const payload = buildOptionUpdatePayload({
      filterData,
      selected,
      optionIdx
    });
    updateFilter({ payload, keyName });
  };

  return options.map((option, i) => {
    const isLast = i === options.length - 1;

    return (
      <FilterCheckbox
        key={i}
        isDtc={isDtc}
        isAnomaly={isAnomaly}
        option={option}
        isLast={isLast}
        idx={i}
        onChange={handleFilterChange}
      />
    );
  });
};

CheckboxGroup.propTypes = {
  keyName: PropTypes.string.isRequired,
  filterData: PropTypes.object.isRequired,
  updateFilter: PropTypes.func.isRequired
};

export default CheckboxGroup;
