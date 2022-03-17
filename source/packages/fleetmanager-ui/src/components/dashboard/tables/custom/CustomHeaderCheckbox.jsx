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
import IndeterminateCheckBoxIcon from "@material-ui/icons/IndeterminateCheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";

const CustomHeaderCheckbox = ({
  selected,
  removeAll,
  addAll,
  updateFunc,
  currentData,
  keyName,
}) => {
  return (
    <th
      style={{
        borderBottom: "1px solid rgba(224, 224, 224, 1)",
        top: 0,
        zIndex: 13,
        position: "sticky",
        textAlign: "left",
        paddingLeft: 16,
        backgroundColor: "#3F51B5",
      }}
    >
      {selected.length ? (
        <IndeterminateCheckBoxIcon
          style={{
            cursor: "pointer",
            color: "white",
          }}
          onClick={() => removeAll(updateFunc, currentData, keyName, selected)}
        />
      ) : (
        <CheckBoxOutlineBlankIcon
          style={{
            cursor: "pointer",
            color: "white",
          }}
          onClick={() => addAll(updateFunc, currentData, keyName, selected)}
        />
      )}
    </th>
  );
};

CustomHeaderCheckbox.propTypes = {
  selected: PropTypes.array.isRequired,
  removeAll: PropTypes.func.isRequired,
  addAll: PropTypes.func.isRequired,
  updateFunc: PropTypes.func.isRequired,
  currentData: PropTypes.object.isRequired,
  keyName: PropTypes.string.isRequired,
};

export default CustomHeaderCheckbox;
