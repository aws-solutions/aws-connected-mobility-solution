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
import { connect } from "react-redux";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import FilterMenu from "./components/FilterMenu";
import PropTypes from "prop-types";
import { toggleFilterIdOpen } from "actions/viewActions";
import { offPink, veryLightGray, white, darkNavyText } from "assets/colors";

const FilterButtonAndMenu = ({
  label,
  isFiltering,
  disabled,
  filterIdOpen,
  keyName,
  toggleFilterMenu,
  filterData,
  maxFilterMenuHeight,
  Component,
}) => {
  const [leftOffset, setLeftOffset] = React.useState(0);
  const classes = useStyles();
  const open = filterIdOpen === keyName;
  const isActive = open || isFiltering;

  const handleClick = ({ target }) => {
    toggleFilterMenu(keyName);
    if (!leftOffset) {
      const spanClick = target.tagName.toUpperCase() === "SPAN";
      const targetEl = spanClick ? target.parentElement : target;
      const { left } = targetEl.getBoundingClientRect();
      setLeftOffset(left);
    }
  };

  return (
    <div className={classes.wrapper}>
      <Button
        variant="contained"
        color="default"
        onClick={handleClick}
        disabled={disabled}
        className={clsx(classes.button, {
          [classes.activeButton]: isActive,
        })}
      >
        {label}
      </Button>
      {!disabled && open && (
        <FilterMenu
          leftOffset={leftOffset}
          filterData={filterData}
          isFiltering={isFiltering}
          keyName={keyName}
          open={open}
          Component={Component}
          maxFilterMenuHeight={maxFilterMenuHeight}
        />
      )}
    </div>
  );
};

FilterButtonAndMenu.propTypes = {
  keyName: PropTypes.string.isRequired,
  filterIdOpen: PropTypes.string,
  label: PropTypes.string.isRequired,
  isFiltering: PropTypes.bool.isRequired,
  maxFilterMenuHeight: PropTypes.number.isRequired,
  // disabled: PropTypes.bool.isRequired,
  Component: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
};

const mapStateToProps = (state) => {
  const {
    views: { filterIdOpen },
  } = state;
  return { filterIdOpen };
};

const mapDispatchToProps = (dispatch) => ({
  toggleFilterMenu: (keyName) => dispatch(toggleFilterIdOpen(keyName)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FilterButtonAndMenu);

const useStyles = makeStyles(() => ({
  wrapper: {
    position: "relative",
    display: "inline-block",
  },
  button: {
    backgroundColor: veryLightGray,
    marginRight: "0.56rem",
    boxShadow: "none",
    color: darkNavyText,
    textTransform: "none",
    height: "1.78rem",
    lineHeight: "1.78rem",
    padding: "0 0.75rem",
    fontSize: "0.75rem",
    minWidth: "1rem",
    "&:hover": {
      backgroundColor: offPink,
      color: white,
      boxShadow: "none",
    },
    "& .MuiButton-label": {
      fontWeight: "normal",
    },
    "&:disabled .MuiButton-label": {
      color: darkNavyText,
      opacity: 0.65,
    },
  },
  activeButton: {
    backgroundColor: offPink,
    color: white,
  },
}));
