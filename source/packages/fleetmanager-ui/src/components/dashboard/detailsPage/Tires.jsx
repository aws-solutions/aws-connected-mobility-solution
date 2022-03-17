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
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import PropTypes from "prop-types";

const Tires = ({ selectedVin, tireData }) => {
  const classes = useStyles();

  const selected = tireData.find((v) => v.vin === selectedVin.vin);
  const pressureFL =
    selected === undefined ? "N/A" : Math.round(selected.pressure_front_left);
  const rocFL =
    selected === undefined ? "N/A" : Math.round(selected.roc_front_left);
  const pressureFR =
    selected === undefined ? "N/A" : Math.round(selected.pressure_front_right);
  const rocFR =
    selected === undefined ? "N/A" : Math.round(selected.roc_front_right);
  const pressureBL =
    selected === undefined ? "N/A" : Math.round(selected.pressure_rear_left);
  const rocBL =
    selected === undefined ? "N/A" : Math.round(selected.roc_rear_left);
  const pressureBR =
    selected === undefined ? "N/A" : Math.round(selected.pressure_rear_right);
  const rocBR =
    selected === undefined ? "N/A" : Math.round(selected.roc_rear_right);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell className={classes.header}>tire</TableCell>
          <TableCell className={classes.header}>mileage</TableCell>
          <TableCell className={classes.header}>pressure</TableCell>
          <TableCell className={classes.header}>24 hr roc</TableCell>
        </TableRow>
      </TableHead>
      <TableBody className={classes.tableBody}>
        <TableRow>
          <TableCell className={classes.tire}>Front Left</TableCell>
          <TableCell className={classes.property}>22,000 km</TableCell>
          <TableCell className={classes.property}>{pressureFL} PSI</TableCell>
          <TableCell className={classes.property}>{rocFL} PSI</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className={classes.tire}>Front Right</TableCell>
          <TableCell className={classes.property}>22,000 km</TableCell>
          <TableCell className={classes.property}>{pressureFR} PSI</TableCell>
          <TableCell className={classes.property}>{rocFR} PSI</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className={classes.tire}>Back Left</TableCell>
          <TableCell className={classes.property}>22,000 km</TableCell>
          <TableCell className={classes.property}>{pressureBL} PSI</TableCell>
          <TableCell className={classes.property}>{rocBL} PSI</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className={classes.tire}>Back Right</TableCell>
          <TableCell className={classes.property}>22,000 km</TableCell>
          <TableCell className={classes.property}>{pressureBR} PSI</TableCell>
          <TableCell className={classes.property}>{rocBR} PSI</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

Tires.propTypes = {
  selectedVin: PropTypes.object.isRequired,
  tireData: PropTypes.array.isRequired,
};

export default Tires;

const useStyles = makeStyles((theme) => ({
  header: {
    backgroundColor: "#8e939b !important",
    textTransform: "uppercase",
    fontSize: 13,
    fontWeight: "600 !important",
    padding: "10px 19px !important",
  },
  tableBody: {
    "& tr:nth-of-type(odd)": {
      backgroundColor: "white",
    },
    "& tr:nth-of-type(even)": {
      backgroundColor: "#F0F0F2",
    },
  },
  tire: {
    fontSize: 20,
    fontWeight: 600,
    border: "none",
  },
  property: {
    fontSize: 16,
    fontWeight: 200,
    border: "none",
  },
}));
