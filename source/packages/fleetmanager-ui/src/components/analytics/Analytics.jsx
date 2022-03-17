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
import React, { useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { fetchAnalyticsData } from "actions/analyticsDataActions";

import CustomLineChart from "./charts/CustomLineChart";
import CustomBarChart from "./charts/CustomBarChart";
import Header from "./../dashboard/Header";

const Analytics = ({ analyticsData, getAllData }) => {
  const classes = useStyles();

  const { energyEconomy } = analyticsData;
  const { occurances } = analyticsData;
  const { distanceTraveled } = analyticsData;
  const { lastUpdated } = analyticsData;

  useEffect(() => {
    if (
      !energyEconomy.length ||
      !occurances.length ||
      !distanceTraveled.length
    ) {
      getAllData();
    }
  }, [
    distanceTraveled.length,
    energyEconomy.length,
    getAllData,
    occurances.length,
  ]);

  return (
    <div className={classes.container}>
      <div className={classes.headerContainer}>
        <Header title={"analytics"} lastUpdated={lastUpdated} />
      </div>
      <div className={classes.chartsContainer}>
        <div className={classes.chart}>
          <CustomLineChart
            data={energyEconomy}
            title={"Energy Economy"}
            measurement={"kWh/100km"}
            colorsArr={["black", "blue", "steelblue", "red"]}
          />
        </div>
        <div className={classes.chart}>
          <CustomBarChart
            data={occurances}
            title={"Occurances Over Threshold"}
            measurement={"Threshold = 35 kWh"}
          />
        </div>
        <div className={classes.chart}>
          <CustomLineChart
            data={distanceTraveled}
            title={"Distance Traveled"}
            measurement={"km"}
            colorsArr={["black", "blue"]}
          />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { analyticsData } = state;
  return { analyticsData };
};

const mapDispatchToProps = (dispatch) => ({
  getAllData: () => dispatch(fetchAnalyticsData()),
});

Analytics.propTypes = {
  analyticsData: PropTypes.object.isRequired,
  getAllData: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Analytics);

const useStyles = makeStyles((theme) => ({
  headerContainer: {
    marginLeft: 34,
  },
  chartsContainer: {
    display: "flex",
    flexWrap: "wrap",
    marginLeft: 17,
    marginTop: 36,
  },
  chart: {
    marginLeft: 17,
    marginBottom: 17,
  },
}));
