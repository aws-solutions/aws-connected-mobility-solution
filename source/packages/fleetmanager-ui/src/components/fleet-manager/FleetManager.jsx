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
import { makeStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import RightSideBar from "components/sidebars/RightSidebar";
import OtaJobsSidebar from "components/sidebars/OtaJobsSidebar";
import UserAlertModal from "components/global/AlertModal";
import ErrorBoundary from "components/global/ErrorBoundary";
import { setUserAlert } from "actions/userActions";
import { rightSidebar, filtersBar } from "assets/dimensions";

const FleetMap = React.lazy(() => import("./FleetMap"));
const Filters = React.lazy(() => import("components/filters/Filters"));

const FleetManager = ({ rightSidebarOpen, alert, closeAlert }) => {
  const classes = useStyles();
  const { alertType, message } = alert;
  const closeAlertHandler = () => setTimeout(closeAlert, 150);

  return (
    <div className={classes.root}>
      <div className={classes.filtersContainer}>
        <ErrorBoundary>
          <React.Suspense fallback={<div />}>
            <Filters />
          </React.Suspense>
        </ErrorBoundary>
      </div>
      <div className={classes.contentWrapper}>
        <div className={classes.content}>
          <ErrorBoundary>
            <React.Suspense fallback={<div />}>
              <FleetMap />
            </React.Suspense>
          </ErrorBoundary>
        </div>
        <div
          className={clsx(classes.rightSidebarContainer, {
            [classes.rightSidebarClosed]: !rightSidebarOpen
          })}
        >
          <RightSideBar />
        </div>
      </div>
      <OtaJobsSidebar />
      <UserAlertModal
        alertType={alertType}
        open={!!message}
        onAccept={closeAlertHandler}
        onClose={closeAlertHandler}
        description={message}
      />
    </div>
  );
};

const mapStateToProps = state => {
  const {
    views: { rightSidebarOpen },
    user: { alert }
  } = state;
  return { rightSidebarOpen, alert };
};

const mapDispatchToProps = dispatch => ({
  closeAlert: () => dispatch(setUserAlert({ message: null }))
});

export default connect(mapStateToProps, mapDispatchToProps)(FleetManager);

const useStyles = makeStyles(theme => ({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column"
  },
  filtersContainer: {
    background: "#FFFFFF",
    flex: `0 0 ${filtersBar.height}`,
    padding: "0 1.31rem",
    display: "flex",
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
    flexDirection: "row",
    alignItems: "center"
  },
  contentWrapper: {
    width: "100%",
    flex: 1,
    display: "flex",
    overflow: "hidden"
  },
  content: {
    flexGrow: 1,
    position: "relative",
    overflow: "hidden"
  },
  rightSidebarContainer: {
    flex: `0 0 ${rightSidebar.width}`,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  rightSidebarClosed: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginRight: `-${rightSidebar.width}`
  }
}));
