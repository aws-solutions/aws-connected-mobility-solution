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

const Battery = ({ selectedVin, batteryData }) => {
  const classes = useStyles();
  const selected = batteryData.find((v) => v.vin === selectedVin.vin);

  return (
    <div className={classes.container}>
      <div className={classes.properties}>
        <div>Mileage</div>
        <div>Current SoC</div>
        <div>Total Charge In</div>
        <div>Total Charge Out</div>
      </div>
      <div className={classes.values}>
        <div>22,000 km</div>
        <div>
          {"current_soc" in selected ? `${selected.current_soc}%` : "N/A"}
        </div>
        <div>
          {"electricenergyin" in selected
            ? `${selected.electricenergyin} kWh`
            : "N/A"}
        </div>
        <div>
          {"electricenergyout" in selected
            ? `${selected.electricenergyout} kWh`
            : "N/A"}
        </div>
      </div>
    </div>
  );
};

Battery.propTypes = {
  selectedVin: PropTypes.object.isRequired,
  batteryData: PropTypes.array.isRequired,
};

export default Battery;

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
