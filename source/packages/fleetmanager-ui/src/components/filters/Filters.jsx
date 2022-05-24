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
import { clearAllFilters } from "actions/filtersActions";
import FilterButtonAndMenu from "./FilterButtonAndMenu";
import CheckboxGroup from "./components/CheckboxGroup";
import LocationFilter from "./LocationFilter";
import VehicleFilter from "./VehicleFilter";
import SoftwareFilter from "./SoftwareFilter";
import { buildIsFilteringMap } from "utils/filterHelpers";
import { filters as filterDimensions } from "assets/dimensions";
import { darkNavyText } from "assets/colors";

const Filters = ({ filters, validMapboxToken, clearFilters }) => {
  const [maxFilterMenuHeight, setMaxFilterMenuHeight] = React.useState(
    filterDimensions.getMaxFilterMenuHeight()
  );
  const classes = useStyles();

  const updateMaxFilterMenuHeight = React.useCallback(() => {
    setMaxFilterMenuHeight(filterDimensions.getMaxFilterMenuHeight());
  }, []);

  const filteringMap = buildIsFilteringMap(filters);
  const isFiltering = !Object.values(filteringMap).every(val => !val);

  React.useEffect(() => {
    updateMaxFilterMenuHeight();
  }, [filters, updateMaxFilterMenuHeight]);

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
          hasOptionsFunc
        } = filter;

        const filterData = filters[keyName];

        return (
          <FilterButtonAndMenu
            label={label}
            key={idx}
            filterData={filters[keyName]}
            isFiltering={isFilteringFunc(filterData)}
            keyName={keyName}
            disabled={!validMapboxToken || !hasOptionsFunc(filterData)}
            maxFilterMenuHeight={maxFilterMenuHeight}
            Component={Component}
          />
        );
      })}
      <Button
        color="primary"
        disabled={!isFiltering}
        className={classes.button}
        onClick={clearFilters}
      >
        Clear
      </Button>
    </>
  );
};

const mapStateToProps = state => {
  const {
    filters,
    map: { validMapboxToken }
  } = state;
  return { filters, validMapboxToken };
};

const mapDispatchToProps = dispatch => ({
  clearFilters: () => dispatch(clearAllFilters())
});

export default connect(mapStateToProps, mapDispatchToProps)(Filters);

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
      backgroundColor: "transparent"
    },
    "&:disabled": {
      pointerEvents: "all",
      cursor: "not-allowed"
    },
    "& .MuiButton-label": {
      fontWeight: "normal"
    }
  }
}));

const checkboxFilteringFunc = data => !data.options.every(op => !op.selected);
const hasOptionsFunc = data => !!data.options.length;
const multiBoxesCheckedFunc = data =>
  data.options.filter(op => op.selected).length > 1;
const multiOptionsSelectedFunc = data => data.options.length > 1;

export const filterComponents = [
  {
    label: "Anomalies",
    keyName: "anomalies",
    Component: CheckboxGroup,
    selectedMultipleFiltersFunc: multiBoxesCheckedFunc,
    isFilteringFunc: checkboxFilteringFunc,
    hasOptionsFunc
  },
  {
    label: "Trouble Codes",
    keyName: "troubleCodes",
    Component: CheckboxGroup,
    selectedMultipleFiltersFunc: multiBoxesCheckedFunc,
    isFilteringFunc: checkboxFilteringFunc,
    hasOptionsFunc
  },
  {
    label: "Location",
    keyName: "location",
    Component: LocationFilter,
    selectedMultipleFiltersFunc: multiOptionsSelectedFunc,
    isFilteringFunc: hasOptionsFunc,
    hasOptionsFunc: () => true
  },
  {
    label: "Vehicle",
    keyName: "vehicle",
    Component: VehicleFilter,
    selectedMultipleFiltersFunc: data =>
      multiOptionsSelectedFunc(data.vin) ||
      multiOptionsSelectedFunc(data.make) ||
      multiOptionsSelectedFunc(data.model) ||
      multiOptionsSelectedFunc(data.year),
    isFilteringFunc: data =>
      hasOptionsFunc(data.vin) ||
      hasOptionsFunc(data.make) ||
      hasOptionsFunc(data.model) ||
      hasOptionsFunc(data.year),
    hasOptionsFunc: () => true
  },
  {
    label: "Software",
    keyName: "software",
    Component: SoftwareFilter,
    selectedMultipleFiltersFunc: data => multiOptionsSelectedFunc(data.version),
    isFilteringFunc: data => hasOptionsFunc(data.version),
    hasOptionsFunc: () => true
  }
];
