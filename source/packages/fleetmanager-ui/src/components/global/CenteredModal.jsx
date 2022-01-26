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
import PropTypes from "prop-types";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Fade from "@material-ui/core/Fade";

const CenteredModal = ({
  onClose,
  open,
  children,
  timeout = 500,
  blurred,
  ...otherProps
}) => {
  const classes = useStyles();

  return (
    <Modal
      className={clsx(classes.modal, { [classes.blurredBg]: blurred })}
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout }}
      {...otherProps}
    >
      <Fade in={open}>{children}</Fade>
    </Modal>
  );
};

CenteredModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  timeout: PropTypes.number,
  blurred: PropTypes.bool
};

export default CenteredModal;

const useStyles = makeStyles(() => ({
  modal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  blurredBg: {
    "& > .MuiBackdrop-root": {
      "-webkit-backdrop-filter": "blur(3px)",
      backdropFilter: "blur(3px)"
    }
  }
}));
