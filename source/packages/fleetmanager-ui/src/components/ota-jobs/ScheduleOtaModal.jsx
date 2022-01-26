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
import { connect } from "react-redux";
import clsx from "clsx";
import _get from "lodash.get";
import PropTypes from "prop-types";
import CenteredModal from "components/global/CenteredModal";
import { makeStyles } from "@material-ui/core/styles";
import { addNewOtaJob } from "actions/dataActions";
import { setUserAlert } from "actions/userActions";
import { setOtaSidebarOpen } from "actions/viewActions";
import { createJobFromFilters, createJobForVehicle } from "apis/ota";
import { Scrollbars } from "react-custom-scrollbars";
import closeIcon from "assets/img/close-icon.svg";
import { reformatFilters } from "utils/dataHelpers";
import {
  darkNavyText,
  lightGray,
  veryLightGray,
  offPink,
  dividerShadowColor
} from "assets/colors";
import softwareList from "assets/mockSoftwareList";

const ScheduleOtaModal = ({
  handleClose,
  open,
  filters,
  selectedVehicleData,
  openOtaSideBar,
  addToJobsList,
  setAlertMessage
}) => {
  const classes = useStyles();
  const [desiredVersion, setDesiredVersion] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const selectedSw = desiredVersion !== null;
  const { vin, deviceId } = _get(selectedVehicleData, "properties", {});

  const softwareSelectionHandler = desiredVersion => () =>
    !requesting && setDesiredVersion(desiredVersion);

  const closeHandler = () => !requesting && handleClose();

  const onCreateJobError = () => {
    setRequesting(false);
    setAlertMessage({ message: "Error creating OTA job" });
  };
  const onCreateJobSuccess = ({ jobId }) => {
    addToJobsList({ jobId });
    openOtaSideBar();
    handleClose();
  };

  const handleDeployOta = () => {
    if (!selectedSw || requesting) return;
    setRequesting(true);

    if (selectedVehicleData) {
      createJobForVehicle({ desiredVersion, deviceId })
        .then(onCreateJobSuccess)
        .catch(onCreateJobError);
    } else {
      const otaFilters = reformatFilters(filters, { otaFilters: true });
      createJobFromFilters({ desiredVersion, filters: otaFilters })
        .then(onCreateJobSuccess)
        .catch(onCreateJobError);
    }
  };

  return (
    <CenteredModal open={open} onClose={closeHandler} blurred>
      <div className={classes.root}>
        <div className={classes.modalheader}>
          <div>Deploy OTA to {vin ? vin : "matching vehicles"}</div>
          <div className={classes.closeIcon} onClick={closeHandler}>
            <img src={closeIcon} alt="Close OTA Dialog" />
          </div>
        </div>
        <div className={classes.swOptionsContainer}>
          <Scrollbars
            autoHide
            hideTracksWhenNotNeeded
            renderTrackHorizontal={props => (
              <div {...props} style={{ display: "none" }} />
            )}
          >
            {softwareList.map(({ id, name }, i) => {
              const isEven = (i + 1) % 2 === 0;
              const isSelected = id === desiredVersion;

              return (
                <div
                  className={clsx(classes.singleRow, {
                    [classes.selectedRow]: isSelected,
                    [classes.evenRow]: isEven
                  })}
                  key={id}
                  onClick={softwareSelectionHandler(id)}
                >
                  {name}
                </div>
              );
            })}
          </Scrollbars>
        </div>
        <div className={classes.actionContainer}>
          <div
            className={clsx(classes.actionButton, classes.deployBtn, {
              [classes.disabledBtn]: !selectedSw || requesting
            })}
            onClick={handleDeployOta}
          >
            {requesting ? "Deploying" : "Deploy Now"}
          </div>
        </div>
      </div>
    </CenteredModal>
  );
};

const mapStateToProps = state => {
  const {
    data: { selectedVehicleData },
    filters
  } = state;
  return { selectedVehicleData, filters };
};

const mapDispatchToProps = dispatch => ({
  addToJobsList: ({ jobId }) => dispatch(addNewOtaJob({ jobId })),
  openOtaSideBar: () => dispatch(setOtaSidebarOpen(true)),
  setAlertMessage: ({ message }) => dispatch(setUserAlert({ message }))
});

ScheduleOtaModal.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export default connect(mapStateToProps, mapDispatchToProps)(ScheduleOtaModal);

const useStyles = makeStyles(() => ({
  root: {
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    width: "23.4375rem",
    borderRadius: "0.328125rem 0.328125rem",
    outline: "none"
  },
  modalheader: {
    display: "flex",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "space-between",
    height: "3.1875rem",
    borderRadius: "0.328125rem 0.328125rem 0 0",
    background: darkNavyText,
    opacity: 1,
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "white",
    padding: "0 1.3125rem",
    letterSpacing: 0,
    "& > div": {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  },
  actionContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "4.6875rem",
    zIndex: 2,
    boxShadow: `0 -0.1rem 0.25rem ${dividerShadowColor}`
  },
  actionButton: {
    display: "inline-block",
    height: "2.72rem",
    lineHeight: "2.72rem",
    padding: "0 1.3125rem",
    borderRadius: "0.28rem",
    fontSize: "0.9375rem",
    fontWeight: 500,
    "&:hover": {
      cursor: "pointer"
    }
  },
  closeIcon: {
    padding: "0.5rem",
    marginRight: "-0.5rem",
    display: "flex",
    alignItems: "center",
    opacity: 0.7,
    "&:hover": {
      cursor: "pointer"
    },
    "& > img": {
      width: "0.5rem",
      height: "0.5rem"
    }
  },
  deployBtn: {
    backgroundColor: offPink,
    color: "#FFFFFF"
  },
  disabledBtn: {
    opacity: 0.5,
    "&:hover": {
      cursor: "not-allowed"
    }
  },
  swOptionsContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "14.67rem",
    overflowY: "auto",
    position: "relative"
  },
  singleRow: {
    display: "flex",
    flexDirecton: "row",
    alignItems: "center",
    height: "2.156rem",
    padding: "0 1.3125rem",
    backgroundColor: veryLightGray,
    "&:hover": {
      cursor: "pointer"
    }
  },
  evenRow: {
    backgroundColor: lightGray
  },
  selectedRow: {
    color: "#FFFFFF",
    backgroundColor: offPink
  }
}));
