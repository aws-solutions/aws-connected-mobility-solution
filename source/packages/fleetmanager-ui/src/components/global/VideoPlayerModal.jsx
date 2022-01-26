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
import CenteredModal from "components/global/CenteredModal";
import PropTypes from "prop-types";
import closeIcon from "assets/img/close-icon.svg";

const VideoPlayerModal = ({
  handleClose,
  open,
  videoUrl,
  videoStartStop = []
}) => {
  const classes = useStyles();
  const [start, stop] = videoStartStop;
  const hasStartStop = start !== undefined && stop !== undefined;
  const startStopSuffix = hasStartStop ? `#t=${start},${stop}` : "";

  return (
    <CenteredModal open={open} onClose={handleClose} blurred>
      <div className={classes.videoBox}>
        <div className={classes.closeIcon} onClick={handleClose}>
          <img src={closeIcon} alt="Close Video Player" />
        </div>
        {videoUrl && (
          <video
            controls
            src={videoUrl + startStopSuffix}
            width="100%"
            height="100%"
            autoPlay
          />
        )}
      </div>
    </CenteredModal>
  );
};

VideoPlayerModal.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  videoUrl: PropTypes.string.isRequired,
  videoStartStop: PropTypes.array
};

export default VideoPlayerModal;

const useStyles = makeStyles(() => ({
  videoBox: {
    backgroundColor: "black",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    width: "67.5rem",
    height: "37.97rem",
    borderRadius: "0.328125rem 0.328125rem",
    outline: "none",
    overflow: "hidden"
  },
  closeIcon: {
    position: "absolute",
    top: "1rem",
    right: "1.375rem",
    padding: "0.5rem",
    marginRight: "-0.5rem",
    display: "flex",
    alignItems: "center",
    "&:hover": {
      cursor: "pointer"
    },
    "& > img": {
      width: "0.5rem",
      height: "0.5rem"
    },
    zIndex: 200
  }
}));
