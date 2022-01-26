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
import { offPink, white, disabledOffPink, offPinkHover } from "assets/colors";

const SubmitButton = ({ onClick, children, disabled, ...otherProps }) => {
  const classes = useStyles();
  const onClickHandler = event => !disabled && onClick && onClick(event);

  return (
    <div
      className={clsx(classes.submitButton, {
        [classes.disabled]: disabled
      })}
      onClick={onClickHandler}
      {...otherProps}
    >
      {children}
    </div>
  );
};

SubmitButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.any.isRequired,
  disabled: PropTypes.bool
};

export default SubmitButton;

const useStyles = makeStyles(() => ({
  submitButton: {
    textAlign: "center",
    height: "2.72rem",
    lineHeight: "2.72rem",
    padding: "0 1.31rem",
    borderRadius: "0.33rem",
    fontSize: "0.94rem",
    fontWeight: 500,
    backgroundColor: offPink,
    color: white,
    "&:hover": {
      backgroundColor: offPinkHover,
      cursor: "pointer"
    }
  },
  disabled: {
    backgroundColor: disabledOffPink,
    "&:hover": {
      cursor: "not-allowed"
    }
  }
}));
