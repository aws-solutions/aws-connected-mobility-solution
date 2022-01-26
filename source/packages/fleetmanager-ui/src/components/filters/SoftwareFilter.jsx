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
import update from "immutability-helper";
import StyledTextField from "components/global/StyledTextField";
import SearchIcon from "@material-ui/icons/Search";
import InputAdornment from "@material-ui/core/InputAdornment";
import TextFiltersList from "./components/TextFiltersList";
import { detectEnterKey, isStringLikeSemVer } from "utils/helpers";

const SoftwareFilter = ({ filterData, updateFilter, keyName }) => {
  const [swVersion, setSwVersion] = React.useState("");

  const clearInput = () => setSwVersion("");
  const inputChangeHandler = event => setSwVersion(event.target.value);

  const queryIsUnique = () =>
    !filterData.version.options.filter(({ label }) => label === swVersion)
      .length;

  const addToCollection = () => {
    if (!isStringLikeSemVer(swVersion)) return;
    const newOption = { label: swVersion };
    const payload = update(filterData, {
      version: {
        $merge: {
          options: [newOption]
        }
      }
    });
    if (queryIsUnique()) updateFilter({ keyName, payload });
    clearInput();
  };

  const handleEnterKey = e => detectEnterKey(e) && addToCollection();

  const sendUpdatedFilterOptions = options => {
    const payload = update(filterData, {
      version: {
        $merge: {
          options
        }
      }
    });
    updateFilter({ keyName, payload });
  };

  return (
    <div style={{ width: "14rem" }}>
      <StyledTextField
        placeholder="Software Version"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          value: swVersion,
          onChange: inputChangeHandler,
          onBlur: addToCollection,
          onKeyPress: handleEnterKey
        }}
        autoFocus
      />
      <TextFiltersList
        listData={filterData.version.options}
        onChange={sendUpdatedFilterOptions}
      />
    </div>
  );
};

SoftwareFilter.propTypes = {
  keyName: PropTypes.string.isRequired,
  filterData: PropTypes.object.isRequired,
  updateFilter: PropTypes.func.isRequired
};

export default SoftwareFilter;
