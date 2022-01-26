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
import KeyboardArrowLeftRoundedIcon from "@material-ui/icons/KeyboardArrowLeftRounded";
import ErrorBoundary from "components/global/ErrorBoundary";
import { setSingleVehicleView } from "actions/viewActions";
import { setSelectedVehicleData } from "actions/dataActions";
import { rightSidebar as rightSidebarDimensions } from "assets/dimensions";
import { grayVehicleBg } from "assets/colors";

const VehicleTabsContainer = React.lazy(() => import("./VehicleTabsContainer"));

const SingleVehiclePanel = ({
  singleVehicleView,
  closeSingleView,
  selectedVehicleData,
  resetSelectedVehicleData
}) => {
  const classes = useStyles();
  const closingPanelRef = React.useRef(false);

  const closePanelHandler = () => {
    closingPanelRef.current = true;
    closeSingleView();
    resetSelectedVehicleData();
  };

  React.useEffect(() => {
    if (selectedVehicleData) closingPanelRef.current = false;
  }, [selectedVehicleData]);

  return (
    <div
      className={clsx(classes.root, {
        [classes.viewOpen]: singleVehicleView,
        [classes.viewClose]: !singleVehicleView
      })}
    >
      <div className={classes.flexWrapper}>
        <div className={classes.actionBar}>
          <div className={classes.backButton} onClick={closePanelHandler}>
            <KeyboardArrowLeftRoundedIcon fontSize="default" /> Back
          </div>
        </div>
        <div className={classes.contentWrapper}>
          <ErrorBoundary>
            {selectedVehicleData && (
              <React.Suspense fallback={<div />}>
                <VehicleTabsContainer
                  selectedVehicleData={selectedVehicleData}
                  closingPanelRef={closingPanelRef}
                />
              </React.Suspense>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  const {
    views: { singleVehicleView },
    data: { selectedVehicleData }
  } = state;
  return { singleVehicleView, selectedVehicleData };
};

const mapDispatchToProps = dispatch => ({
  closeSingleView: () => dispatch(setSingleVehicleView(false)),
  resetSelectedVehicleData: () => dispatch(setSelectedVehicleData(null))
});

export default connect(mapStateToProps, mapDispatchToProps)(SingleVehiclePanel);

const useStyles = makeStyles(theme => ({
  root: {
    position: "absolute",
    opacity: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: grayVehicleBg,
    zIndex: 1
  },
  flexWrapper: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    overflowY: "auto"
  },
  actionBar: {
    flex: "0 0 3.47rem",
    display: "flex"
  },
  backButton: {
    display: "flex",
    padding: "0 1.4rem",
    alignItems: "center",
    "&:hover": {
      cursor: "pointer"
    },
    fontSize: "1.125rem"
  },
  contentWrapper: {
    flex: 1
  },
  viewOpen: {
    marginLeft: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  viewClose: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginLeft: rightSidebarDimensions.width
  }
}));
