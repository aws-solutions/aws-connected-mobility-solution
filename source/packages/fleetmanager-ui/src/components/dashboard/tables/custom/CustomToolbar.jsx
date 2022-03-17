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
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import { Tooltip, Popover } from "@material-ui/core";
import AspectRatioIcon from "@material-ui/icons/AspectRatio";
import SettingsIcon from "@material-ui/icons/Settings";
import InputAdornment from "@material-ui/core/InputAdornment";
import PropTypes from "prop-types";
import clsx from "clsx";

import { connect } from "react-redux";
import {
  clearPressureFilters,
  updatePressureFilters,
} from "actions/dashboardFiltersActions";
import {
  setSingleSetting,
  setMultipleSettings,
} from "actions/tableSettignsActions";
import { defaultState as defaultSettings } from "store/reducers/tableSettingsReducer";

import StyledTextField from "components/global/StyledTextField";
import { isNumber } from "utils/helpers";
import { offPink } from "assets/colors";

const CustomToolbar = ({
  keyName,
  keyName2,
  tempKeyName,
  tempKeyName2,
  title,
  subTitle,
  subTitle2,
  expand,
  expandTable,
  dashboardFilters,
  tableSettings,
  // setPressureFilters,
  resetPressureFilters,
  updateSingleSetting,
  updateMultipleSettings,
  measurement,
}) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  // const highRoC = dashboardFilters.pressure.highRoC;
  // const lowPressure = dashboardFilters.pressure.lowPressure;

  const id = open ? "simple-popover" : undefined;

  const handlePopoverClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    if (tableSettings[tempKeyName] === "")
      updateSingleSetting(tempKeyName, defaultSettings[keyName]);
  };

  // const handleFilterCheckbox = (e) => {
  //   const name = e.target.name;
  //   setPressureFilters(name);
  // };

  const handleFilterClear = () => {
    resetPressureFilters();
    updateSingleSetting(tempKeyName, defaultSettings[keyName]);
    if (keyName2) updateSingleSetting(tempKeyName2, defaultSettings[keyName2]);
  };

  const handleSaveFilter = () => {
    handlePopoverClose();
    if (
      tableSettings[tempKeyName] !== "" &&
      tableSettings[tempKeyName2] !== ""
    ) {
      if (keyName2) {
        updateMultipleSettings(keyName, keyName2, {
          [keyName]: tableSettings[tempKeyName],
          [keyName2]: tableSettings[tempKeyName2],
        });
      } else {
        updateSingleSetting(keyName, tableSettings[tempKeyName]);
      }
    }
  };

  const inputChangeHandler = (event, input) => {
    const currInput = event.target.value;

    if (input) {
      if (isNumber(currInput)) updateSingleSetting(tempKeyName2, currInput);
    } else {
      if (isNumber(currInput)) updateSingleSetting(tempKeyName, currInput);
    }
  };

  return (
    <div>
      <Tooltip title="Settings">
        <IconButton onClick={handlePopoverClick}>
          <SettingsIcon style={{ color: "white" }} />
        </IconButton>
      </Tooltip>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <div className={classes.filterContainer}>
          <div className={classes.title}>{title}</div>
          {/* {keyName === "tirePressure" && (
            <div className={classes.checkboxesContainer}>
              <div className={classes.checkboxContainer}>
                <StyledCheckbox
                  name="lowPressure"
                  checked={lowPressure}
                  onChange={handleFilterCheckbox}
                />
                low pressure
              </div>
              <div className={classes.checkboxContainer}>
                <StyledCheckbox
                  name="highRoC"
                  checked={highRoC}
                  onChange={handleFilterCheckbox}
                />
                high roC
              </div>
            </div>
          )} */}
          <div className={classes.settingsInputContainer}>
            <div className={classes.subtitle}>{subTitle}</div>
            <StyledTextField
              className={clsx(
                keyName === "efficiency" || keyName === "charging"
                  ? classes.settingsInputLong
                  : classes.settingsInputShort
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment
                    position="end"
                    className={classes.inputAdornment}
                  >
                    {measurement}
                  </InputAdornment>
                ),
                value: tableSettings[tempKeyName],
                onChange: inputChangeHandler,
              }}
            />
          </div>
          {keyName === "tirePressure" && (
            <div className={classes.settingsInputContainer}>
              <div className={classes.subtitle}>{subTitle2}</div>
              <StyledTextField
                className={classes.settingsInputShort}
                InputProps={{
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      className={classes.inputAdornment}
                    >
                      {measurement}
                    </InputAdornment>
                  ),
                  value: tableSettings[tempKeyName2],
                  onChange: (e) => inputChangeHandler(e, "roc"),
                }}
              />
            </div>
          )}
          <div className={classes.btnContainer}>
            <p
              style={{
                cursor:
                  // highRoC ||
                  // lowPressure ||
                  defaultSettings[keyName] !== tableSettings[tempKeyName]
                    ? "pointer"
                    : "not-allowed",
                color:
                  // highRoC ||
                  // lowPressure ||
                  defaultSettings[keyName] !== tableSettings[tempKeyName]
                    ? "black"
                    : "gray",
                margin: 0,
              }}
              onClick={handleFilterClear}
            >
              Clear
            </p>
            <p className={classes.saveBtn} onClick={handleSaveFilter}>
              Save
            </p>
          </div>
        </div>
      </Popover>
      {keyName === "tirePressure" && (
        <Tooltip title={expand ? "Minimize" : "Expand"}>
          <IconButton onClick={() => expandTable()}>
            <AspectRatioIcon style={{ color: "white" }} />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};

const mapStateToProps = (state) => {
  const { dashboardFilters, tableSettings } = state;
  return { dashboardFilters, tableSettings };
};

const mapDispatchToProps = (dispatch) => ({
  setPressureFilters: (keyname) => dispatch(updatePressureFilters(keyname)),
  resetPressureFilters: () => dispatch(clearPressureFilters()),
  updateSingleSetting: (keyName, payload) =>
    dispatch(setSingleSetting(keyName, payload)),
  updateMultipleSettings: (keyName, keyName2, payload) =>
    dispatch(setMultipleSettings(keyName, keyName2, payload)),
});

CustomToolbar.propTypes = {
  keyName: PropTypes.string.isRequired,
  keyName2: PropTypes.string,
  tempKeyName: PropTypes.string.isRequired,
  tempKeyName2: PropTypes.string,
  title: PropTypes.string.isRequired,
  subTitle: PropTypes.string.isRequired,
  subTitle2: PropTypes.string,
  expand: PropTypes.bool,
  expandTable: PropTypes.func,
  dashboardFilters: PropTypes.object.isRequired,
  tableSettings: PropTypes.object.isRequired,
  resetPressureFilters: PropTypes.func.isRequired,
  updateSingleSetting: PropTypes.func.isRequired,
  updateMultipleSettings: PropTypes.func.isRequired,
  measurement: PropTypes.string.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(CustomToolbar);

const useStyles = makeStyles((theme) => ({
  filterContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    // height: 288,
    width: 220,
    padding: 16,
    // textTransform: "capitalize",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 34,
    textTransform: "capitalize",
  },
  subtitle: {
    textTransform: "capitalize",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    textTransform: "capitalize",
  },
  settingsInputContainer: {
    color: "#BBC0C1",
    marginTop: 12,
  },
  settingsInputShort: {
    width: "30%",
  },
  settingsInputLong: {
    width: "65%",
  },
  inputAdornment: {
    fontSize: "0.875rem !important",
  },
  checkbox: {
    color: "#3F51B5 !important",
  },
  btnContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 32,
  },
  saveBtn: {
    cursor: "pointer",
    color: offPink,
    margin: 0,
  },
}));
