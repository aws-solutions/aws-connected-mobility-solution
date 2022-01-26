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
import { makeStyles } from "@material-ui/core/styles";
import { progressBarBg, pastelGreen } from "assets/colors";

const LinearProgressBar = () => {
  const classes = useStyles();

  return (
    <div className={classes.progress}>
      <div className="indeterminate" />
    </div>
  );
};

export default LinearProgressBar;

const useStyles = makeStyles(() => ({
  progress: {
    position: "relative",
    height: "0.1875rem",
    display: "block",
    width: "100%",
    backgroundColor: progressBarBg,
    borderRadius: "0.14rem",
    backgroundClip: "padding-box",
    overflow: "hidden",
    "& .indeterminate": {
      backgroundColor: pastelGreen
    },
    "& .indeterminate:before": {
      content: "''",
      position: "absolute",
      backgroundColor: "inherit",
      top: "0",
      left: "0",
      bottom: "0",
      willChange: "left, right",
      "-webkit-animation":
        "$indeterminate 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite",
      animation:
        "$indeterminate 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite"
    },
    "& .indeterminate:after": {
      content: "''",
      position: "absolute",
      backgroundColor: "inherit",
      top: "0",
      left: "0",
      bottom: "0",
      willChange: "left, right",
      "-webkit-animation":
        "$indeterminate-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite",
      animation:
        "$indeterminate-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite",
      "-webkit-animation-delay": "1.15s",
      "animation-delay": "1.15s"
    }
  },
  "@keyframes indeterminate": {
    "0%": {
      left: "-35%",
      right: "100%"
    },
    "60%": {
      left: "100%",
      right: "-90%"
    },
    "100%": {
      left: "100%",
      right: "-90%"
    }
  },
  "@keyframes indeterminate-short": {
    "0%": {
      left: "-200%",
      right: "100%"
    },
    "60%": {
      left: "107%",
      right: "-8%"
    },
    "100%": {
      left: "107%",
      right: "-8%"
    }
  }
}));
