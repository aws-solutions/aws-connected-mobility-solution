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
import { makeStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { BATTERY, EFFICIENCY, TIRES, CHARGING } from "./tables/tableTypes";

const Header = ({ title, dashboardData, lastUpdated }) => {
  const classes = useStyles();

  const getVehicleCount = () => {
    let count =
      dashboardData[TIRES].count +
      dashboardData[BATTERY].count +
      dashboardData[CHARGING].count +
      dashboardData[EFFICIENCY].count;
    return count;
  };
  return (
    <div className={classes.headerInnerContainer}>
      <h1 className={classes.title}>{title}</h1>
      <p className={classes.vehicleTotal}>
        Showing {getVehicleCount()} vehicles
      </p>
      <p className={classes.lastUpdated}>Last updated {lastUpdated}</p>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { dashboardData } = state;
  return { dashboardData };
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
  dashboardData: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(Header);

const useStyles = makeStyles((theme) => ({
  headerInnerContainer: {
    display: "flex",
    flexDirection: "column",
    // marginLeft: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 5,
    marginTop: 10,
    textTransform: "uppercase",
  },
  vehicleTotal: {
    margin: "0 0 5px 0",
  },
  lastUpdated: {
    margin: "0 0 16px 0",
  },
}));
