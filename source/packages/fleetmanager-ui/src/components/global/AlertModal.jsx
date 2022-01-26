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
import CenteredModal from "components/global/CenteredModal";
import { makeStyles } from "@material-ui/core/styles";
import WarningIcon from "@material-ui/icons/ErrorOutlineOutlined";
import ErrorIcon from "@material-ui/icons/CancelOutlined";
import {
  darkNavyText,
  midGray,
  offPink,
  alertOrange,
  errorRed
} from "assets/colors";

const AlertModal = ({
  onClose,
  open,
  alertType,
  onAccept,
  onCancel,
  alertTitle,
  description,
  acceptButtonText = "OK",
  cancelButtonText = "Cancel"
}) => {
  const classes = useStyles();
  const errorAlert = alertType === "error";

  const AlertIcon = props => {
    let Icon = WarningIcon;
    switch (alertType) {
      case "error":
        Icon = ErrorIcon;
        break;
      case "confirm":
      case "warning":
      default:
        Icon = WarningIcon;
        break;
    }
    return <Icon {...props} />;
  };

  return (
    <CenteredModal open={open} onClose={onClose}>
      <div className={classes.root}>
        <div
          className={clsx(classes.alertIcon, {
            [classes.errorIcon]: errorAlert
          })}
        >
          <AlertIcon
            fontSize="inherit"
            htmlColor={open ? "inherit" : "transparent"}
          />
        </div>
        {alertTitle && <div className={classes.alertTitle}>{alertTitle}</div>}
        {description && (
          <div className={classes.description}>{description}</div>
        )}
        <div className={classes.actionContainer}>
          {onCancel && (
            <div
              className={clsx(classes.actionButton, classes.cancelBtn)}
              onClick={onCancel}
            >
              {cancelButtonText}
            </div>
          )}
          <div className={classes.actionButton} onClick={onAccept}>
            {acceptButtonText}
          </div>
        </div>
      </div>
    </CenteredModal>
  );
};

AlertModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  onAccept: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  alertType: PropTypes.string,
  alertTitle: PropTypes.string,
  description: PropTypes.string,
  acceptButtonText: PropTypes.string,
  cancelButtonText: PropTypes.string
};

export default AlertModal;

const useStyles = makeStyles(() => ({
  root: {
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    position: "relative",
    maxWidth: "32rem",
    minWidth: "24rem",
    padding: "0.5rem 2rem 1.5rem 2rem",
    borderRadius: "0.328rem 0.328rem",
    outline: "none",
    "& > div": {
      marginTop: "1rem"
    }
  },
  alertIcon: {
    color: alertOrange,
    opacity: 0.9,
    fontSize: "5.5rem",
    lineHeight: 0
  },
  errorIcon: {
    color: errorRed
  },
  alertTitle: {
    fontSize: "1.3rem",
    fontWeight: "bold",
    color: darkNavyText
  },
  description: {
    textAlign: "center",
    marginBottom: "0.5rem"
  },
  actionContainer: {},
  actionButton: {
    display: "inline-block",
    backgroundColor: offPink,
    color: "#FFFFFF",
    height: "2.5rem",
    lineHeight: "2.5rem",
    padding: "0 1.3125rem",
    borderRadius: "0.28rem",
    fontSize: "0.9375rem",
    fontWeight: 500,
    "&:hover": {
      cursor: "pointer"
    },
    "&:nth-of-type(2)": {
      marginLeft: "1rem"
    }
  },
  cancelBtn: {
    backgroundColor: midGray,
    color: "#FFFFFF"
  }
}));
