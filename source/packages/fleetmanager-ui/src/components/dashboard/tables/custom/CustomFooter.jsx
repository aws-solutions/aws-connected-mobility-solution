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
import TableFooter from "@material-ui/core/TableFooter";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import { withStyles } from "@material-ui/core/styles";
import TablePagination from "@material-ui/core/TablePagination";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import IconButton from "@material-ui/core/IconButton";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import CloseIcon from "@material-ui/icons/Close";
import PropTypes from "prop-types";
import clsx from "clsx";

import { handleDropDown } from "utils/helpers";

const defaultFooterStyles = {
  root: {
    borderBottom: "none",
    fontFamily: "AmazonEmber !important",
  },
  cell: {
    padding: 0,
    display: "flex",
    justifyContent: "flex-end",
    border: "none",
  },
  pagination: {
    backgroundColor: "#171E2D",
    borderBottom: "none",
  },
  selectIcon: {
    color: "white",
  },
  cellBorderRadius: {
    backgroundColor: "#171E2D",
    borderBottom: "none",
  },
  alertBtn: {
    padding: "10px 15px",
    borderRadius: 3,
    border: "none",
    fontWeight: 600,
    outline: "none",
  },
  alertBtnActive: {
    backgroundColor: "white",
    color: "#171E2D",
    cursor: "pointer",
  },
  alertBtnDisabled: {
    backgroundColor: "lighgray",
    color: "gray",
  },
  snackbar: {
    backgroundColor: "white",
    color: "black",
    border: "2px solid #3F51B5",
  },
  message: {
    display: "flex",
    alignItems: "center",
  },
};

const CustomFooter = ({
  classes,
  count,
  page,
  onChangePage,
  onChangeRowsPerPage,
  sendMessage,
  selected,
  alertMessage,
  setAlertMessage,
  removeAll,
  updateFunc,
  currentData,
  keyName,
}) => {
  const handleClose = () => {
    setAlertMessage("");
    removeAll(updateFunc, currentData, keyName, selected);
  };

  return (
    <TableFooter style={{ backgroundColor: "#171E2D" }}>
      <TableRow
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TableCell className={classes.cellBorderRadius}>
          <Snackbar
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            open={alertMessage !== ""}
            onClose={handleClose}
            onExit={handleClose}
            autoHideDuration={6000}
          >
            <SnackbarContent
              className={classes.snackbar}
              message={
                <div className={classes.message}>
                  <ErrorOutlineIcon
                    style={{ marginRight: 10, color: "#3F51B5" }}
                  />{" "}
                  {alertMessage}! {selected.length} vehicles have been alerted.
                </div>
              }
              action={
                <>
                  <IconButton onClick={handleClose}>
                    <CloseIcon style={{ color: "black" }} />
                  </IconButton>
                </>
              }
            />
          </Snackbar>
          <button
            className={clsx(
              classes.alertBtn,
              selected.length
                ? classes.alertBtnActive
                : classes.alertBtnDisabled
            )}
            onClick={() => sendMessage()}
          >
            Alert Vehicle(s)
          </button>
        </TableCell>
        <TablePagination
          className={classes.cell}
          classes={{ root: classes.root, selectIcon: classes.selectIcon }}
          count={count}
          page={page}
          rowsPerPage={currentData[keyName].rowsPerPage}
          onChangePage={onChangePage}
          labelRowsPerPage="Rows"
          rowsPerPageOptions={[10, 15, 30]}
          onChangeRowsPerPage={(e) => {
            onChangeRowsPerPage(e);
            handleDropDown(e, currentData, updateFunc, keyName);
          }}
        />
      </TableRow>
    </TableFooter>
  );
};

CustomFooter.propTypes = {
  classes: PropTypes.object.isRequired,
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
  onChangeRowsPerPage: PropTypes.func.isRequired,
  sendMessage: PropTypes.func.isRequired,
  selected: PropTypes.array.isRequired,
  alertMessage: PropTypes.string.isRequired,
  setAlertMessage: PropTypes.func.isRequired,
  removeAll: PropTypes.func.isRequired,
  updateFunc: PropTypes.func.isRequired,
  currentData: PropTypes.object.isRequired,
  keyName: PropTypes.string.isRequired,
};

export default withStyles(defaultFooterStyles, { name: "CustomFooter" })(
  CustomFooter
);
