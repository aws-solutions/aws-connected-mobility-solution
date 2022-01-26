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
import React, { useState } from "react";
import PropTypes from "prop-types";
import update from "immutability-helper";
import StyledTextField from "components/global/StyledTextField";
import SearchIcon from "@material-ui/icons/Search";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextFiltersList from "./components/TextFiltersList";
import { detectEnterKey, isStringInteger } from "utils/helpers";

const subFilters = [
  { subKeyName: "vin", label: "VIN" },
  { subKeyName: "make", label: "Make" },
  { subKeyName: "model", label: "Model" },
  { subKeyName: "year", label: "Year" }
];

const VehicleFilter = ({ filterData, updateFilter, keyName }) => {
  const [inputCollection, setInputCollection] = useState({});
  const handleEnterKey = subKeyName => e =>
    detectEnterKey(e) && addToFilterCollection(subKeyName)();

  const inputChangeHandler = subKeyName => e => {
    e.persist();
    setInputCollection(obj => ({
      ...obj,
      [subKeyName]: e.target.value
    }));
  };

  const clearInput = subKeyName =>
    setInputCollection(obj => ({
      ...obj,
      [subKeyName]: ""
    }));

  const inputIsUnique = subKeyName =>
    !filterData[subKeyName].options.filter(
      ({ label }) =>
        label.toLowerCase() === inputCollection[subKeyName].toLowerCase().trim()
    ).length;

  const addToFilterCollection = subKeyName => () => {
    const currInput = inputCollection[subKeyName];
    if (!currInput) return;
    if (subKeyName === "year" && !isStringInteger(currInput)) return;

    const newOption = { label: currInput.trim() };
    const payload = update(filterData, {
      $merge: {
        [subKeyName]: {
          options: [...filterData[subKeyName].options, newOption]
        }
      }
    });
    if (inputIsUnique(subKeyName)) updateFilter({ keyName, payload });
    clearInput(subKeyName);
  };

  const sendUpdatedFilterData = subKeyName => options => {
    const payload = update(filterData, {
      $merge: {
        [subKeyName]: { options }
      }
    });
    updateFilter({ keyName, payload });
  };

  return (
    <div style={{ width: "14.5rem" }}>
      {subFilters.map(({ subKeyName, label }, idx) => {
        const first = idx === 0;
        return (
          <div key={subKeyName} style={{ marginTop: first ? 0 : "1rem" }}>
            <StyledTextField
              placeholder={label}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                value: inputCollection[subKeyName] || "",
                onChange: inputChangeHandler(subKeyName),
                onBlur: addToFilterCollection(subKeyName),
                onKeyPress: handleEnterKey(subKeyName)
              }}
              autoFocus={first ? true : false}
            />
            <TextFiltersList
              listData={filterData[subKeyName].options}
              onChange={sendUpdatedFilterData(subKeyName)}
            />
          </div>
        );
      })}
    </div>
  );
};

VehicleFilter.propTypes = {
  keyName: PropTypes.string.isRequired,
  filterData: PropTypes.object.isRequired,
  updateFilter: PropTypes.func.isRequired
};

export default VehicleFilter;
