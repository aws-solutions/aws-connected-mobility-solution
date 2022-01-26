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
import PropTypes from "prop-types";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import MuiExpansionPanel from "@material-ui/core/ExpansionPanel";
import MuiExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import RightArrowWhite from "assets/img/right-arrow-white.svg";
import { ota, otaSidebar } from "assets/dimensions";
import {
  darkNavyText,
  midGray,
  pastelGreen,
  otaScrollbarBackground
} from "assets/colors";

const OtaJobCardDetails = React.lazy(() => import("./OtaJobCardDetails"));

const OtaJobCard = ({
  data,
  style,
  jobTitle,
  index,
  jobIdOpen,
  onJobToggle,
  dataCacheRef,
  resetListIndex,
  hasScrollbar
}) => {
  const classes = useStyles();
  const { jobId, status } = data;
  const open = jobId === jobIdOpen;
  const jobCompleted = status === "COMPLETED";
  const jobStatusLabel = statusLabelMap[status];

  const toggleOpen = () => onJobToggle({ jobId, index });

  return (
    <ExpansionPanel
      square
      expanded={open}
      onChange={toggleOpen}
      style={style}
      className={clsx({ [classes.scrollbarGutter]: hasScrollbar })}
    >
      <JobTitleBar>
        <div className={clsx(classes.jobTitle, classes.flexCenter)}>
          <div>{jobTitle}</div>
          <img
            src={RightArrowWhite}
            alt={`${open ? "Close" : "Open"} OTA Job Details`}
            className={clsx(classes.arrowImg, {
              [classes.arrowClose]: open
            })}
          />
        </div>
        <div
          className={clsx(classes.jobStatus, classes.flexCenter, {
            [classes.completed]: jobCompleted,
            [classes.scrollbarOffset]: hasScrollbar
          })}
        >
          {jobStatusLabel}
        </div>
      </JobTitleBar>
      {open && (
        <React.Suspense fallback={<div />}>
          <OtaJobCardDetails
            data={data}
            jobIdx={index}
            dataCacheRef={dataCacheRef}
            resetListIndex={resetListIndex}
          />
        </React.Suspense>
      )}
    </ExpansionPanel>
  );
};

OtaJobCard.propTypes = {
  data: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  jobIdOpen: PropTypes.string,
  hasScrollbar: PropTypes.bool,
  style: PropTypes.object.isRequired,
  onJobToggle: PropTypes.func.isRequired,
  dataCacheRef: PropTypes.object.isRequired,
  resetListIndex: PropTypes.func.isRequired,
  jobTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default OtaJobCard;

const useStyles = makeStyles(() => ({
  flexCenter: {
    display: "flex",
    alignItems: "center"
  },
  jobTitle: {
    flex: 1,
    color: "white",
    fontSize: "1.125rem",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    textTransform: "uppercase"
  },
  jobStatus: {
    flex: 1,
    fontSize: "0.75rem",
    opacity: 1,
    color: midGray,
    justifyContent: "flex-end"
  },
  scrollbarOffset: {
    marginRight: `-${otaSidebar.scrollbarWidth}`
  },
  arrowImg: {
    marginLeft: "0.9rem",
    height: "0.47rem",
    opacity: 0.5
  },
  arrowClose: {
    transform: "rotate(90deg)",
    transformOrigin: "center center"
  },
  completed: {
    color: pastelGreen
  },
  scrollbarGutter: {
    paddingRight: otaSidebar.scrollbarWidth,
    background: `linear-gradient(to right, ${otaScrollbarBackground} 0%, ${otaScrollbarBackground} 100%) no-repeat right`,
    backgroundSize: otaSidebar.scrollbarWidth
  }
}));

const ExpansionPanel = withStyles({
  root: {
    marginBottom: ota.marginBottomPixels,
    boxShadow: "none",
    "&:before": {
      display: "none"
    },
    "&$expanded": {
      margin: "auto"
    }
  },
  expanded: {}
})(MuiExpansionPanel);

const JobTitleBar = withStyles({
  root: {
    display: "flex",
    alignItems: "center",
    minHeight: ota.jobTitleCardHeight,
    height: ota.jobTitleCardHeight,
    "&$expanded": {
      minHeight: ota.jobTitleCardHeight,
      height: ota.jobTitleCardHeight
    },
    background: darkNavyText,
    opacity: 0.7,
    padding: "0 1.31rem"
  },
  content: {
    margin: 0,
    "&$expanded": {
      margin: 0
    }
  },
  expanded: {}
})(MuiExpansionPanelSummary);

const statusLabelMap = {
  IN_PROGRESS: "In Progress",
  CANCELED: "Canceled",
  COMPLETED: "Completed",
  DELETION_IN_PROGRESS: "Deletion In Progress"
};
