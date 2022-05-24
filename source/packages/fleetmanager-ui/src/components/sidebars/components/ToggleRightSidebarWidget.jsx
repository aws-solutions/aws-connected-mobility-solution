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
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import { toggleRightSidebar } from "actions/viewActions";
import { shortenNumber } from "utils/helpers";
import { rightSidebar, toggleSidebarBtn } from "assets/dimensions";
import { boxShadowColor, darkNavyBg } from "assets/colors";
import carIcon from "assets/img/car-icon.svg";
import RightArrowWhite from "assets/img/right-arrow-white.svg";

const ToggleRightSidebarWidget = ({
  vehicleCount = 0,
  toggleSidebar,
  rightSidebarOpen
}) => {
  const classes = useStyles();
  return (
    <div
      className={clsx(classes.widgetContainer, {
        [classes.widgetOpen]: rightSidebarOpen,
        [classes.widgetClose]: !rightSidebarOpen
      })}
      onClick={toggleSidebar}
    >
      <div className={classes.vehicleIconCountContainer}>
        <div className={classes.vehicleIcon}>
          <img src={carIcon} alt="Vehicle" />
        </div>
        <div className={classes.vehiclesCount}>
          {shortenNumber(vehicleCount)}
        </div>
      </div>
      <div style={{ marginTop: "-0.14rem" }}>
        <img
          src={RightArrowWhite}
          alt={`${rightSidebarOpen ? "Close" : "Open"} OTA Jobs`}
          className={clsx(classes.arrowImg, {
            [classes.arrowOpen]: rightSidebarOpen,
            [classes.arrowClose]: !rightSidebarOpen
          })}
        />
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  const {
    data: {
      vehicleList: { vehicleCount }
    },
    views: { rightSidebarOpen }
  } = state;
  return {
    vehicleCount,
    rightSidebarOpen
  };
};

const mapDispatchToProps = dispatch => ({
  toggleSidebar: () => dispatch(toggleRightSidebar())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ToggleRightSidebarWidget);

const useStyles = makeStyles(theme => ({
  widgetContainer: {
    position: "fixed",
    top: `calc(50vh + ${toggleSidebarBtn.topOffset})`,
    right: 0,
    zIndex: 1,
    background: darkNavyBg,
    boxShadow: `0 0.47rem 1.4rem ${boxShadowColor}`,
    borderRadius: "0 0 0.14rem 0.14rem",
    opacity: 1,
    transform: "rotate(90deg)",
    transformOrigin: "center bottom",
    color: "white",
    height: toggleSidebarBtn.height,
    width: toggleSidebarBtn.width,
    fontSize: "0.75rem",
    textAlign: "center",
    padding: "0.5rem",
    userSelect: "none",
    "&:hover": {
      cursor: "pointer"
    }
  },
  widgetOpen: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginRight: `calc(${rightSidebar.width} + 0.125rem)`
  },
  widgetClose: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginRight: 0
  },
  vehicleIconCountContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "1rem",
    overflow: "hidden"
  },
  vehicleIcon: {
    flex: 0,
    padding: "0.35rem 0.5rem 0 0.3rem",
    opacity: 0.8,
    "& > img": {
      height: "0.75rem"
    }
  },
  vehiclesCount: {
    flex: 1,
    textAlign: "left"
  },
  arrowImg: {
    transformOrigin: "center center",
    height: "0.47rem",
    opacity: 0.5
  },
  arrowOpen: {
    transform: "rotate(270deg)"
  },
  arrowClose: {
    transform: "rotate(90deg)"
  }
}));
