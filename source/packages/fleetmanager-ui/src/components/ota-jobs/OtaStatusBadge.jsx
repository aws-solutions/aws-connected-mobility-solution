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
import { makeStyles } from "@material-ui/core/styles";
import LinearProgressBar from "components/global/LinearProgressBar";
import { darkNavyText, pastelGreen, white, errorRed } from "assets/colors";

const OtaStatusBadge = ({ data }) => {
  const classes = useStyles();
  const { status } = data;
  const completed = status === "SUCCEEDED";
  const queued = status === "QUEUED";
  const inProgress = status === "IN_PROGRESS";
  const error = !completed && !queued && !inProgress;

  if (!inProgress) {
    return (
      <div
        className={clsx(classes.baseStatus, {
          [classes.queuedStatus]: queued,
          [classes.errorStatus]: error,
          [classes.completeStatus]: completed
        })}
      >
        {completed ? "COMPLETE" : status}
      </div>
    );
  } else
    return (
      <div className={classes.progressBarContainer}>
        <LinearProgressBar />
      </div>
    );
};

OtaStatusBadge.propTypes = {
  data: PropTypes.object.isRequired
};

export default OtaStatusBadge;

const useStyles = makeStyles(() => ({
  baseStatus: {
    display: "inline-block",
    textAlign: "center",
    color: white,
    borderRadius: "0.19rem",
    padding: "0.2rem 0.3rem",
    fontSize: "0.5156rem",
    fontWeight: "bold"
  },
  completeStatus: {
    backgroundColor: pastelGreen
  },
  queuedStatus: {
    backgroundColor: darkNavyText,
    opacity: 0.4
  },
  errorStatus: {
    backgroundColor: errorRed
  },
  progressBarContainer: {
    width: "3.28rem"
  }
}));
