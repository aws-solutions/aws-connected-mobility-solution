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
import ToggleOtaSidebarButton from "./components/ToggleOtaSidebarButton";
import ErrorBoundary from "components/global/ErrorBoundary";
import { connect } from "react-redux";
import { setOtaSidebarOpen } from "actions/viewActions";
import { listJobsPaginated } from "apis/ota";
import { setPaginatedOtaJobsList } from "actions/dataActions";
import { otaSidebar, appBar } from "assets/dimensions";

const OtaJobsList = React.lazy(() => import("components/ota-jobs/OtaJobsList"));

const OtaJobsSidebar = ({ otaSidebarOpen, setOpen, setPaginatedJobsData }) => {
  const classes = useStyles();
  const onToggle = () => setOpen(!otaSidebarOpen);
  const dataCacheRef = React.useRef({
    scrollOffset: 0,
    cachedOpenIndex: null,
    cachedOpenJobId: null,
    jobScrollMap: {}
  });

  const otaJobsPaginationHandler = React.useCallback(
    async (nextToken = null) => {
      try {
        const jobsData = await listJobsPaginated({ nextToken });
        setPaginatedJobsData(jobsData);
      } catch {
        setPaginatedJobsData({ nextToken: null });
      }
    },
    [setPaginatedJobsData]
  );

  React.useEffect(() => {
    otaJobsPaginationHandler();
  }, [otaJobsPaginationHandler]);

  return (
    <>
      <ToggleOtaSidebarButton
        onToggle={onToggle}
        otaSidebarOpen={otaSidebarOpen}
      />
      <div
        className={clsx(classes.ota, {
          [classes.otaOpen]: otaSidebarOpen,
          [classes.otaClose]: !otaSidebarOpen
        })}
      >
        <ErrorBoundary>
          {otaSidebarOpen && (
            <React.Suspense fallback={<div />}>
              <OtaJobsList
                dataCacheRef={dataCacheRef}
                otaJobsPaginationHandler={otaJobsPaginationHandler}
              />
            </React.Suspense>
          )}
        </ErrorBoundary>
      </div>
      {otaSidebarOpen && (
        <div className={classes.otaBackdrop} onClick={onToggle} />
      )}
    </>
  );
};

const mapStateToProps = state => {
  const {
    views: { otaSidebarOpen }
  } = state;
  return { otaSidebarOpen };
};

const mapDispatchToProps = dispatch => ({
  setOpen: val => dispatch(setOtaSidebarOpen(val)),
  setPaginatedJobsData: jobsList => dispatch(setPaginatedOtaJobsList(jobsList))
});

export default connect(mapStateToProps, mapDispatchToProps)(OtaJobsSidebar);

const useStyles = makeStyles(theme => ({
  ota: {
    width: otaSidebar.width,
    flexShrink: 0,
    height: `calc(100vh - ${appBar.height})`,
    position: "fixed",
    left: 0,
    top: appBar.height,
    zIndex: 15,
    backgroundColor: "white"
  },
  otaOpen: {
    marginLeft: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  otaClose: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    overflow: "hidden",
    marginLeft: `-${otaSidebar.width}`
  },
  otaBackdrop: {
    position: "fixed",
    top: appBar.height,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    "-webkit-backdrop-filter": "blur(3px)",
    backdropFilter: "blur(3px)",
    zIndex: 12
  }
}));
