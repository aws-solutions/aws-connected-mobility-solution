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
import _clone from "lodash.clonedeep";
import _isEqual from "lodash.isequal";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { makeStyles } from "@material-ui/core/styles";
import Fade from "@material-ui/core/Fade";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import { Scrollbars } from "react-custom-scrollbars";
import { refreshVehicles } from "actions/dataActions";
import {
  setSingleFilter,
  resetFilterByKeyName,
} from "actions/dashboardFiltersActions";
import { getAllTablesData } from "actions/dashboardDataActions";
import { setFilterIdOpen } from "actions/viewActions";
import { filters } from "assets/dimensions";
import { convertRemToPx } from "utils/helpers";
import { offPink, white, lightGray, boxShadowColor } from "assets/colors";

const DashboardFilterMenu = ({
  leftOffset,
  filterData,
  updateFilter,
  resetFilter,
  keyName,
  Component,
  open,
  closeFilter,
  maxFilterMenuHeight,
  getLatestVehicles,
  isFiltering,
  getAllData,
}) => {
  const awayClickRef = React.useRef(false);
  const initialFilterDataRef = React.useRef(_clone(filterData));
  const currFilterDataRef = React.useRef(filterData);
  const classes = useStyles();

  const getFilteredVehicles = React.useCallback(
    () => getLatestVehicles(keyName),
    [getLatestVehicles, keyName]
  );

  const resetFilterHandler = () => isFiltering && resetFilter(keyName);
  const saveFilterHandler = () => {
    closeFilter();
    // getFilteredVehicles();
    getAllData({ forceUpdate: true });
  };

  const onAwayClick = () => {
    awayClickRef.current = true;
    closeFilter();
  };

  React.useEffect(() => {
    currFilterDataRef.current = filterData;
  }, [filterData]);

  React.useEffect(() => {
    return () => {
      const initialFilter = initialFilterDataRef;
      const currFilter = currFilterDataRef.current;
      const filterChanged = !_isEqual(currFilter, initialFilter.current);
      if (awayClickRef.current && filterChanged) getFilteredVehicles();
    };
  }, [getFilteredVehicles]);

  return (
    <ClickAwayListener onClickAway={onAwayClick}>
      <Fade in={open} timeout={500}>
        <div className={classes.optionsContainer} style={{ left: leftOffset }}>
          <Scrollbars
            autoHeight
            autoHeightMin={convertRemToPx(filters.minMenuHeight)}
            autoHeightMax={maxFilterMenuHeight}
            hideTracksWhenNotNeeded
          >
            <div
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div>
                <Component
                  filterData={filterData}
                  keyName={keyName}
                  updateFilter={updateFilter}
                />
              </div>
              <div className={classes.filtersActionBar}>
                <div
                  className={clsx(classes.clearFilters, classes.btnCursor, {
                    [classes.disabled]: !isFiltering,
                  })}
                  onClick={resetFilterHandler}
                >
                  Clear
                </div>
                <div
                  className={`${classes.saveFilters} ${classes.btnCursor}`}
                  onClick={saveFilterHandler}
                >
                  Save
                </div>
              </div>
            </div>
          </Scrollbars>
        </div>
      </Fade>
    </ClickAwayListener>
  );
};

const mapDispatchToProps = (dispatch) => ({
  closeFilter: () => dispatch(setFilterIdOpen(null)),
  updateFilter: ({ payload, keyName }) =>
    dispatch(setSingleFilter({ payload, keyName })),
  resetFilter: (keyName) => dispatch(resetFilterByKeyName(keyName)),
  getLatestVehicles: (source) =>
    dispatch(refreshVehicles({ source, forceUpdate: true })),
  getAllData: (forceUpdate) => dispatch(getAllTablesData(forceUpdate)),
});

DashboardFilterMenu.propTypes = {
  leftOffset: PropTypes.number.isRequired,
  maxFilterMenuHeight: PropTypes.number.isRequired,
  keyName: PropTypes.string.isRequired,
  isFiltering: PropTypes.bool.isRequired,
  filterData: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  Component: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
};

export default connect(null, mapDispatchToProps)(DashboardFilterMenu);

const useStyles = makeStyles(() => ({
  optionsContainer: {
    position: "fixed",
    top: filters.menuFixedTopPositionPx,
    maxWidth: "calc(90vw - 100px)",
    minWidth: "17rem",
    minHeight: filters.minMenuHeight,
    background: white,
    boxShadow: `0px 0.47rem 1.4rem ${boxShadowColor}`,
    borderRadius: "0.328rem",
    color: "#000",
    zIndex: 14,
  },
  openOrFiltering: {
    backgroundColor: offPink,
    color: white,
  },
  filtersActionBar: {
    marginTop: "1rem",
  },
  btnCursor: {
    "&:hover": {
      cursor: "pointer",
    },
  },
  clearFilters: {
    float: "left",
  },
  saveFilters: {
    float: "right",
    color: offPink,
  },
  disabled: {
    color: lightGray,
    "&:hover": {
      cursor: "not-allowed",
    },
  },
}));
