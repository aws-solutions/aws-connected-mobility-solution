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
import TextFiltersList from "./components/TextFiltersList";
import MapboxAutocomplete from "./components/MapboxAutocomplete";

const LocationFilter = ({ filterData, updateFilter, keyName }) => {
  const selectedLocations = filterData.options;

  const addNewLocation = newLocation => {
    const payload = {
      ...filterData,
      options: [...selectedLocations, newLocation]
    };
    updateFilter({ keyName, payload });
  };

  const sendNewFilterData = options => {
    const payload = { ...filterData, options };
    updateFilter({ keyName, payload });
  };

  return (
    <div style={{ width: "18rem" }}>
      <MapboxAutocomplete
        addNewLocation={addNewLocation}
        selectedLocations={selectedLocations}
      />
      <TextFiltersList
        listData={selectedLocations}
        onChange={sendNewFilterData}
      />
    </div>
  );
};

LocationFilter.propTypes = {
  keyName: PropTypes.string.isRequired,
  filterData: PropTypes.object.isRequired,
  updateFilter: PropTypes.func.isRequired
};

export default LocationFilter;
