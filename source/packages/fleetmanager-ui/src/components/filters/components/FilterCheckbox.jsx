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
import clsx from "clsx";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import StyledCheckbox from "components/global/Checkbox";
import { offPink } from "assets/colors";
import dtcMappings from "assets/mappings/dtcMappings";
import anomalyMappings from "assets/mappings/anomalyMappings";
import _get from "lodash.get";

const Checkbox = ({ option, idx, onChange, isDtc, isAnomaly, isLast }) => {
  const classes = useStyles();
  const { label, count, selected, id } = option;
  const handleChange = e => onChange(e.target.checked, idx);
  const handleClick = () => onChange(!selected, idx);
  let dtcLabel, anomalyLabel;

  if (isDtc) dtcLabel = dtcMappings[id] || "Unknown Code";
  if (isAnomaly) anomalyLabel = _get(anomalyMappings[id], "label");

  return (
    <div className={clsx(classes.root, { [classes.last]: isLast })}>
      <StyledCheckbox checked={selected} onChange={handleChange} />
      <span onClick={handleClick} className={classes.label}>
        {dtcLabel || anomalyLabel || label}
      </span>
      {count !== undefined && (
        <span style={{ color: offPink }}>&nbsp;{`(${count})`}</span>
      )}
    </div>
  );
};

Checkbox.propTypes = {
  option: PropTypes.object.isRequired,
  idx: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  isDtc: PropTypes.bool,
  isAnomaly: PropTypes.bool,
  isLast: PropTypes.bool
};

export default Checkbox;

const useStyles = makeStyles(() => ({
  root: {
    display: "flex",
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
    alignItems: "center",
    marginBottom: "0.5rem"
  },
  last: {
    marginBottom: 0
  },
  label: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    "&:hover": {
      cursor: "pointer"
    }
  }
}));
