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
import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import { clearAllFilters } from "actions/dashboardFiltersActions";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ErrorBoundary from "components/global/ErrorBoundary";
import Header from "./Header";
import TablesContainer from "./tables/TablesContainer";
import DeviceDetails from "./detailsPage/DeviceDetails";
import { setSingleData, getAllTablesData } from "actions/dashboardDataActions";

import { filtersBar } from "assets/dimensions";

const DashboardFilters = React.lazy(() =>
  import("components/filters/DashboardFilters")
);

const Dashboard = ({ getAllData, dashboardData }) => {
  useEffect(() => {
    getAllData({ forceUpdate: false });
  }, [getAllData]);

  const classes = useStyles();
  const [selectedVin, setSelectedVin] = useState(null);
  const [detailsType, setDetailsType] = useState("");

  const { lastUpdated } = dashboardData;

  return (
    <div>
      <div className={classes.filtersContainer}>
        <ErrorBoundary>
          <React.Suspense fallback={<div />}>
            <DashboardFilters getAllTablesData={getAllTablesData} />
          </React.Suspense>
        </ErrorBoundary>
      </div>
      <div className={classes.headerContainer}>
        {selectedVin === null ? (
          <Header title={"my fleet"} lastUpdated={lastUpdated} />
        ) : null}

        {selectedVin === null ? null : (
          <div>
            <div
              className={classes.backLink}
              onClick={() => setSelectedVin(null)}
            >
              <ArrowBackIcon />
              Back to Fleet Dashboard
            </div>
            <div className={classes.breadcrumb}>
              <span
                className={classes.previous}
                onClick={() => setSelectedVin(null)}
              >
                my fleet {<ArrowForwardIosIcon style={{ margin: "0 10px" }} />}
              </span>{" "}
              vin {selectedVin.vin}
            </div>
          </div>
        )}

        {selectedVin === null ? (
          <TablesContainer
            setSelectedVin={setSelectedVin}
            setDetailsType={setDetailsType}
          />
        ) : (
          <DeviceDetails selectedVin={selectedVin} detailsType={detailsType} />
        )}
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { dashboardData } = state;
  return { dashboardData };
};

const mapDispatchToProps = (dispatch) => ({
  updateSingleData: (keyName, payload) =>
    dispatch(setSingleData(keyName, payload)),
  clearFilters: () => dispatch(clearAllFilters()),
  getAllData: (forceUpdate) => dispatch(getAllTablesData(forceUpdate)),
});

Dashboard.propTypes = {
  getAllData: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);

const useStyles = makeStyles((theme) => ({
  filtersContainer: {
    background: "#FFFFFF",
    flex: `0 0 ${filtersBar.height}`,
    padding: "0 1.31rem",
    display: "flex",
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
    flexDirection: "row",
    alignItems: "center",
    height: 46,
  },
  headerContainer: {
    width: "95%",
    margin: "0 auto",
  },
  backLink: {
    width: "fit-content",
    color: "#3F51B5",
    fontSize: 24,
    display: "flex",
    alignItems: "center",
    margin: "10px 0 20px 0",
    cursor: "pointer",
    "& > svg": {
      marginRight: 12,
    },
  },
  breadcrumb: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 32,
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
  },
  previous: {
    display: "flex",
    alignItems: "center",
    color: "#BBC0C1",
    cursor: "pointer",
  },
}));
