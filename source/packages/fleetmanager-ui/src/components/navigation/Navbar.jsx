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
import { makeStyles } from "@material-ui/core/styles";
import UserAccountDropdown from "./UserAccountDropdown";
import { appBar } from "assets/dimensions";
import awsLogo from "assets/img/aws-logo.svg";
import * as colors from "assets/colors";

const Navbar = ({ children }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.appBar}>
        <div className={classes.appNameBox}>
          <img src={awsLogo} alt="AWS" className={classes.appLogo} />
          Fleet Manager
        </div>
        <UserAccountDropdown />
      </div>
      <div className={classes.mainWrapper}>{children}</div>
    </div>
  );
};

Navbar.propTypes = {
  children: PropTypes.node
};

export default Navbar;

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%"
  },
  appBar: {
    flex: `0 0 ${appBar.height}`,
    backgroundColor: colors.veryDarkNavy,
    color: colors.white,
    padding: "0 1.31rem",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    userSelect: "none"
  },
  appNameBox: {
    display: "flex",
    alignItems: "center",
    fontSize: "0.84rem"
  },
  appLogo: {
    marginTop: "0.25rem",
    alignSelf: "middle",
    height: "0.83rem",
    marginRight: "0.84rem"
  },
  avatarIcon: {
    height: "1.69rem",
    "&:hover": {
      cursor: "pointer"
    }
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: colors.veryLightGray,
    position: "relative",
    width: "100%"
  }
}));
