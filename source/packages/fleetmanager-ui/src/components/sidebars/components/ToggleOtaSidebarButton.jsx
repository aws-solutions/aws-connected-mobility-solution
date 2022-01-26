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
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import { otaSidebar, toggleSidebarBtn } from "assets/dimensions";
import { boxShadowColor, darkNavyBg } from "assets/colors";
import RightArrowWhite from "assets/img/right-arrow-white.svg";

const ToggleOtaSidebarButton = ({ otaSidebarOpen, onToggle }) => {
  const classes = useStyles();

  return (
    <div
      className={clsx(classes.buttonContainer, {
        [classes.otaClose]: !otaSidebarOpen,
        [classes.otaOpen]: otaSidebarOpen
      })}
      onClick={onToggle}
    >
      <div>OTA Jobs</div>
      <div style={{ marginTop: "-0.2rem" }}>
        <img
          src={RightArrowWhite}
          alt={`${otaSidebarOpen ? "Close" : "Open"} OTA Jobs`}
          className={clsx(classes.arrowImg, {
            [classes.arrowOpen]: otaSidebarOpen,
            [classes.arrowClose]: !otaSidebarOpen
          })}
        />
      </div>
    </div>
  );
};

ToggleOtaSidebarButton.propTypes = {
  onToggle: PropTypes.func.isRequired,
  otaSidebarOpen: PropTypes.bool.isRequired
};

export default ToggleOtaSidebarButton;

const useStyles = makeStyles(theme => ({
  buttonContainer: {
    position: "fixed",
    top: `calc(50vh + ${toggleSidebarBtn.topOffset})`,
    left: 0,
    zIndex: 13,
    background: darkNavyBg,
    boxShadow: `0 0.47rem 1.4rem ${boxShadowColor}`,
    borderRadius: "0 0 0.14rem 0.14rem",
    opacity: 1,
    transform: "rotate(270deg)",
    transformOrigin: "center bottom",
    color: "white",
    height: toggleSidebarBtn.height,
    width: toggleSidebarBtn.width,
    fontSize: "0.75rem",
    textAlign: "center",
    "&:hover": {
      cursor: "pointer"
    },
    "& div": {
      textAlign: "center"
    },
    padding: "0.5rem",
    userSelect: "none"
  },
  otaOpen: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: otaSidebar.width
  },
  otaClose: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginLeft: 0
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
