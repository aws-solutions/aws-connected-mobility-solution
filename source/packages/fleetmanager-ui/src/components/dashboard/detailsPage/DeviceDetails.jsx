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
import { Grid, Paper } from "@material-ui/core";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import TabsBtns from "./TabsBtns";
import General from "./General";
import Tires from "./Tires";
import Battery from "./Battery";
import amzVehicle from "assets/img/aws_daimler_photo.png";

const DeviceDetails = ({ selectedVin, dashboardData, detailsType }) => {
  const classes = useStyles();
  const [selectedTab, setSelectedTab] = useState("general");
  return (
    <div>
      <Paper elevation={4} className={classes.container}>
        <Grid item lg={6} sm={12}>
          <div className={classes.vehicleImg}>
            <img
              style={{ width: "100%" }}
              src={amzVehicle}
              alt="amazon vehicle"
            />
          </div>
        </Grid>
        <Grid item lg={6} sm={12} style={{ backgroundColor: "#F8F8F9" }}>
          <div className={classes.vinContainer}>
            <h1 className={classes.vin}>{selectedVin.vin}</h1>
            <h4 className={classes.vanType}>2019 Mercedes-Benz Daimler</h4>
          </div>
          <div className={classes.divider}></div>
          <TabsBtns selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          {selectedTab === "general" ? (
            <General selectedVin={selectedVin} />
          ) : selectedTab === "tires" ? (
            <Tires
              selectedVin={selectedVin}
              tireData={dashboardData.tirePressureData.data}
            />
          ) : (
            <Battery
              selectedVin={selectedVin}
              batteryData={dashboardData[detailsType].data}
            />
          )}
        </Grid>
      </Paper>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { dashboardData } = state;
  return { dashboardData };
};

DeviceDetails.propTypes = {
  selectedVin: PropTypes.object.isRequired,
  dashboardData: PropTypes.object.isRequired,
};

export default connect(mapStateToProps)(DeviceDetails);

const useStyles = makeStyles((theme) => ({
  container: {
    width: 1200,
    height: 695,
    display: "flex",
  },
  vehicleImg: {},
  vinContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  vin: {
    fontSize: 36,
    fontWeight: 400,
    marginBottom: 12,
  },
  vanType: {
    fontSize: 24,
    fontWeight: 400,
    marginTop: 0,
    marginBottom: 59,
    color: "#8E939B",
  },
  divider: {
    borderBottom: "1px solid #E3E4E6",
    width: "75%",
    margin: "0 auto 30px auto",
  },
}));
