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
import { connect } from "react-redux";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import DashboardFilterButtonAndMenu from "./DashboardFilterButtonAndMenu";
import LocationFilter from "./LocationFilter";
import VehicleFilter from "./VehicleFilter";
// import IgnitionFilter from "./IgnitionFilter";
import { buildIsFilteringMap } from "utils/filterHelpers";
import { filters as filterDimensions } from "assets/dimensions";
import { darkNavyText } from "assets/colors";
import { clearAllFiltersRefreshData } from "actions/dashboardDataActions";

const DashboardFilters = ({
  filters,
  dashboardFilters,
  validMapboxToken,
  clearRefresh,
}) => {
  const [maxFilterMenuHeight, setMaxFilterMenuHeight] = React.useState(
    filterDimensions.getMaxFilterMenuHeight()
  );
  const classes = useStyles();

  const updateMaxFilterMenuHeight = React.useCallback(() => {
    setMaxFilterMenuHeight(filterDimensions.getMaxFilterMenuHeight());
  }, []);

  const filteringMap = buildIsFilteringMap(dashboardFilters, "dashboard");
  const isFiltering = !Object.values(filteringMap).every((val) => !val);

  React.useEffect(() => {
    updateMaxFilterMenuHeight();
  }, [dashboardFilters, updateMaxFilterMenuHeight]);

  React.useEffect(() => {
    window.addEventListener("resize", updateMaxFilterMenuHeight);
    return () => {
      window.removeEventListener("resize", updateMaxFilterMenuHeight);
    };
  }, [updateMaxFilterMenuHeight]);

  return (
    <>
      {filterComponents.map((filter, idx) => {
        const {
          label,
          keyName,
          Component,
          isFilteringFunc,
          // hasOptionsFunc,
        } = filter;

        const filterData = dashboardFilters[keyName];

        return (
          <DashboardFilterButtonAndMenu
            label={label}
            key={idx}
            filterData={dashboardFilters[keyName]}
            isFiltering={isFilteringFunc(filterData)}
            keyName={keyName}
            // disabled={!validMapboxToken || !hasOptionsFunc(filterData)}
            disabled={false}
            maxFilterMenuHeight={maxFilterMenuHeight}
            Component={Component}
          />
        );
      })}
      <Button
        color="primary"
        disabled={!isFiltering}
        className={classes.button}
        onClick={clearRefresh}
      >
        Clear
      </Button>
    </>
  );
};

const mapStateToProps = (state) => {
  const {
    filters,
    dashboardFilters,
    map: { validMapboxToken },
  } = state;
  return { filters, dashboardFilters, validMapboxToken };
};

const mapDispatchToProps = (dispatch) => ({
  clearRefresh: () => dispatch(clearAllFiltersRefreshData()),
});

export default connect(mapStateToProps, mapDispatchToProps)(DashboardFilters);

const useStyles = makeStyles(() => ({
  button: {
    marginRight: "0.56rem",
    color: darkNavyText,
    boxShadow: "none",
    textTransform: "none",
    height: "1.78rem",
    lineHeight: "1.78rem",
    padding: "0 0.75rem",
    fontSize: "0.75rem",
    minWidth: "1rem",
    "&:hover": {
      boxShadow: "none",
      backgroundColor: "transparent",
    },
    "&:disabled": {
      pointerEvents: "all",
      cursor: "not-allowed",
    },
    "& .MuiButton-label": {
      fontWeight: "normal",
    },
  },
}));

const hasOptionsFunc = (data) => !!data.options.length;
const multiOptionsSelectedFunc = (data) => data.options.length > 1;

export const filterComponents = [
  {
    label: "Location",
    keyName: "location",
    Component: LocationFilter,
    selectedMultipleFiltersFunc: multiOptionsSelectedFunc,
    isFilteringFunc: hasOptionsFunc,
    hasOptionsFunc: () => true,
  },
  {
    label: "Vehicle",
    keyName: "vehicle",
    Component: VehicleFilter,
    selectedMultipleFiltersFunc: (data) =>
      multiOptionsSelectedFunc(data.vin) ||
      multiOptionsSelectedFunc(data.make) ||
      multiOptionsSelectedFunc(data.model) ||
      multiOptionsSelectedFunc(data.year),
    isFilteringFunc: (data) =>
      hasOptionsFunc(data.vin) ||
      hasOptionsFunc(data.make) ||
      hasOptionsFunc(data.model) ||
      hasOptionsFunc(data.year),
    hasOptionsFunc: () => true,
  },
  // {
  //   label: "Ignition",
  //   keyName: "ignition",
  //   Component: IgnitionFilter,
  //   selectedMultipleFiltersFunc: (data) => multiOptionsSelectedFunc(data.on),
  //   isFilteringFunc: (data) => blah(data.on),
  //   hasOptionsFunc: () => true,
  // },
];
