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
import VehiclesList from "components/vehicles/VehiclesList";
import ToggleRightSidebarWidget from "components/sidebars/components/ToggleRightSidebarWidget";
import ErrorBoundary from "components/global/ErrorBoundary";
import {
  buildIsFilteringMap,
  getApplyingMultFilters
} from "utils/filterHelpers";
import { setFilteredWorldVehicles } from "actions/dataActions";
import { offPink, white, dividerShadowColor } from "assets/colors";

const SingleVehiclePanel = React.lazy(() =>
  import("components/vehicles/SingleVehiclePanel")
);
const ScheduleOtaModal = React.lazy(() =>
  import("components/ota-jobs/ScheduleOtaModal")
);
const AlertModal = React.lazy(() => import("components/global/AlertModal"));

const RightSidebar = ({
  zoomFetchVehiclesForOta,
  vehicleCount,
  singleVehicleView,
  selectedVehicleData,
  filters,
  zoom
}) => {
  const classes = useStyles();
  const [zoomingOut, setZoomingOut] = React.useState(false);
  const [scheduleOtaModalOpen, setScheduleOtaModalOpen] = React.useState(false);
  const [confirmOtaAlert, setConfirmOtaAlert] = React.useState(false);
  const [multiFiltersAlert, setMultiFiltersAlert] = React.useState(false);
  const filteringMap = buildIsFilteringMap(filters);
  const noFiltersApplied = Object.values(filteringMap).every(filter => !filter);
  const applyingMultipleFilters = getApplyingMultFilters(filters);

  const closeMultiFiltersAlertModal = () => setMultiFiltersAlert(false);
  const closeConfirmOtaAlertModal = () => setConfirmOtaAlert(false);
  const openConfirmOtaAlertModal = () => setConfirmOtaAlert(true);

  const disabledOtaHandler = () => {
    const { location, anomalies } = filteringMap;
    if (!singleVehicleView && !vehicleCount) return true;
    else if (singleVehicleView && selectedVehicleData) return false;
    else if (noFiltersApplied || location || anomalies) return true;
    return false;
  };

  const disabledOta = disabledOtaHandler();
  const closeScheduleOta = () => setScheduleOtaModalOpen(false);
  const openScheduleOta = () => setScheduleOtaModalOpen(true);
  const scheduleOtaClickHandler = () => {
    if (disabledOta || zoomingOut) return;
    if (applyingMultipleFilters) return setMultiFiltersAlert(true);
    if (selectedVehicleData || zoom < 0.4) return openScheduleOta();
    setZoomingOut(true);
    setTimeout(openConfirmOtaAlertModal, 300);
    zoomFetchVehiclesForOta().finally(() => setZoomingOut(false));
  };

  React.useEffect(() => {
    disabledOta && scheduleOtaModalOpen && closeScheduleOta();
  }, [disabledOta, scheduleOtaModalOpen]);

  React.useEffect(() => {
    disabledOta && confirmOtaAlert && closeConfirmOtaAlertModal();
  }, [disabledOta, confirmOtaAlert]);

  React.useEffect(() => {
    disabledOta && multiFiltersAlert && closeMultiFiltersAlertModal();
  }, [disabledOta, multiFiltersAlert]);

  return (
    <div className={classes.root}>
      <ToggleRightSidebarWidget />
      <div className={classes.content}>
        <ErrorBoundary>
          <React.Suspense fallback={<div />}>
            <SingleVehiclePanel />
          </React.Suspense>
          <VehiclesList />
        </ErrorBoundary>
      </div>
      <div className={classes.actionBar}>
        <div
          className={clsx(classes.scheduleOtaBtn, {
            [classes.disabled]: disabledOta
          })}
          onClick={scheduleOtaClickHandler}
        >
          Schedule OTA
        </div>
      </div>
      <ErrorBoundary>
        <React.Suspense fallback={<div />}>
          {scheduleOtaModalOpen && (
            <ScheduleOtaModal
              handleClose={closeScheduleOta}
              open={scheduleOtaModalOpen}
            />
          )}
          {multiFiltersAlert && (
            <AlertModal
              open={multiFiltersAlert}
              alertType="error"
              onClose={closeMultiFiltersAlertModal}
              onAccept={closeMultiFiltersAlertModal}
              alertTitle="Filter limit exceeded"
              description="OTA jobs are limited to 1 filter per (sub)category"
            />
          )}
          {confirmOtaAlert && (
            <AlertModal
              open={confirmOtaAlert}
              alertType="confirm"
              alertTitle="Do you want to create an OTA job?"
              description="All vehicles matching the filter criteria will be targeted for an OTA job"
              onAccept={() => {
                closeConfirmOtaAlertModal();
                openScheduleOta();
              }}
              onCancel={closeConfirmOtaAlertModal}
              onClose={() => {}}
              acceptButtonText="Yes"
              cancelButtonText="No"
            />
          )}
        </React.Suspense>
      </ErrorBoundary>
    </div>
  );
};

const mapStateToProps = state => {
  const {
    views: { singleVehicleView },
    data: {
      selectedVehicleData,
      vehicleList: { vehicleCount }
    },
    map: {
      viewport: { zoom }
    },
    filters
  } = state;
  return {
    vehicleCount,
    singleVehicleView,
    selectedVehicleData,
    filters,
    zoom
  };
};

const mapDispatchToProps = dispatch => ({
  zoomFetchVehiclesForOta: () =>
    dispatch(setFilteredWorldVehicles({ fromOta: true }))
});

export default connect(mapStateToProps, mapDispatchToProps)(RightSidebar);

const useStyles = makeStyles(() => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    overflowY: "auto",
    backgroundColor: white
  },
  content: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    position: "relative"
  },
  actionBar: {
    flex: "0 0 4.69rem",
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
    zIndex: 1,
    boxShadow: `0 -0.1rem 0.25rem ${dividerShadowColor}`
  },
  scheduleOtaBtn: {
    display: "inline-block",
    height: "2.72rem",
    lineHeight: "2.72rem",
    padding: "0 1.31rem",
    borderRadius: "0.33rem",
    fontSize: "0.94rem",
    fontWeight: 500,
    backgroundColor: offPink,
    color: white,
    "&:hover": {
      cursor: "pointer"
    }
  },
  disabled: {
    opacity: "0.4",
    "&:hover": {
      cursor: "not-allowed"
    }
  }
}));
