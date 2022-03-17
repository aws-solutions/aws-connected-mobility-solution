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
import { makeStyles } from "@material-ui/core/styles";

const General = ({ selectedVin }) => {
  const classes = useStyles();
  return (
    <div className={classes.container}>
      <div className={classes.properties}>
        <div>Vin</div>
        <div>License Plate</div>
        <div>Year</div>
        <div>Make</div>
        <div>Model</div>
        <div>Mileage</div>
      </div>
      <div className={classes.values}>
        <div>{selectedVin.vin}</div>
        <div>6smf296</div>
        <div>2019</div>
        <div>Mercedes-Benz</div>
        <div>Daimler</div>
        <div>57,123 miles</div>
      </div>
    </div>
  );
};

General.propTypes = {
  selectedVin: PropTypes.object.isRequired,
};

export default General;

const useStyles = makeStyles((theme) => ({
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridGap: 24,
    width: "60%",
    margin: "0 auto",
    fontSize: 20,
  },
  properties: {
    fontWeight: 600,
    "& > div": {
      marginBottom: 30,
    },
  },
  values: {
    fontWeight: 200,
    "& > div": {
      marginBottom: 30,
    },
  },
}));
