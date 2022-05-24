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
import _get from "lodash.get";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import { useIsMounted } from "utils/reactHooks";
import { getSingleVehicle } from "apis/vehicles";
import Tooltip from "@material-ui/core/Tooltip";
import { darkNavyText, offPink } from "assets/colors";
import dtcMappings from "assets/mappings/dtcMappings";
import vehicleMappings, { vehicleKeys } from "assets/mappings/vehicleMappings";
import { ZOOMED_UPDATE_INTERVAL } from "assets/appConfig";


const VehicleDetails = ({ vin, dataCacheRef, scrollTo }) => {
  const classes = useStyles();
  const isMounted = useIsMounted();
  const [loading, setLoading] = React.useState(true);
  const [vehicleData, setVehicleData] = React.useState(null);
  const previousVin = React.useRef(vin);
  const swVersion = _get(vehicleData, "devices[0].swVersion");

  const renderMetadataByKey = keyName => {
    const value = _get(vehicleData, keyName);
    const annotations = vehicleMappings[keyName];
    if (annotations !== undefined && annotations === 'layout.section') {
      const { label } = annotations
      return (
        <div className={classes.row} key={label}>
        </div>
      )
    }
    if (value === undefined || !annotations) return null;
    const { label, unit } = annotations;

    return (
      <div className={classes.row} key={keyName}>
        <div className={classes.label}>{label}</div>
        <div className={classes.info}>
          {value.toString().replace("_", " ")} {unit}
        </div>
      </div>
    );
  };

  const renderTroubleCodes = () => {
    const { troubleCodes = [] } = vehicleData;
    if (!troubleCodes.length) return "None";

    return troubleCodes.map((id, idx) => {
      const desc = dtcMappings[id] || "Unknown Code";
      return (
        <HtmlTooltip key={idx} title={<React.Fragment>{desc}</React.Fragment>}>
          <div className={classes.singleDtc}>{`${id}: ${desc}`}</div>
        </HtmlTooltip>
      );
    });
  };

  React.useEffect(() => {
    if (vin && isMounted.current) {
      const sameVin = vin === previousVin.current;
      const vehicleDataCache = dataCacheRef.current.vehicleData;
      previousVin.current = vin;
      if (sameVin && vehicleDataCache) {
        setVehicleData(vehicleDataCache);
        setLoading(false);
        setTimeout(() => scrollTo({ prevPos: true }), 50);
      } else {
        setVehicleData(null);
        setLoading(true);
        setInterval( () => {
          getSingleVehicle(vin)
            .then(vehicle => isMounted.current && setVehicleData(vehicle))
            .catch(() => null)
            .finally(() => {
              if (isMounted.current) {
                setLoading(false);
                scrollTo({ details: true });
              }
            });
        }, ZOOMED_UPDATE_INTERVAL );
      }
    }
  }, [vin, isMounted, dataCacheRef, scrollTo]);

  React.useEffect(() => {
    if (isMounted.current) dataCacheRef.current.vehicleData = vehicleData;
  }, [vehicleData, dataCacheRef, isMounted]);

  if (loading) return <div style={{ textAlign: "center" }}>Loading...</div>;
  if (!loading && !vehicleData)
    return <div style={{ textAlign: "center" }}>No vehicle data</div>;

  return (
    <div className={classes.container}>
      <div className={classes.row}>
        <div className={classes.label}>Software</div>
        <div className={classes.info}>{swVersion}</div>
      </div>
      <div className={classes.row}>
        <div className={classes.label}>Trouble Codes</div>
        <div className={classes.info}>{renderTroubleCodes()}</div>
      </div>
      {vehicleKeys.map(key => renderMetadataByKey(key))}
    </div>
  );
};

VehicleDetails.propTypes = {
  vin: PropTypes.string.isRequired,
  dataCacheRef: PropTypes.object.isRequired,
  scrollTo: PropTypes.func
};

export default VehicleDetails;

const useStyles = makeStyles(() => ({
  container: {
    padding: "0 2.81rem",
    fontSize: "0.9375rem",
    color: darkNavyText
  },
  row: {
    display: "flex",
    paddingBottom: "1rem"
  },
  label: {
    flex: 1,
    fontWeight: "bold"
  },
  info: {
    flex: 1,
    overflow: "hidden"
  },
  tabLink: {
    display: "flex",
    alignItems: "flex-start",
    color: offPink,
    "&:hover": {
      cursor: "pointer"
    }
  },
  singleDtc: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    "&:hover": {
      cursor: "pointer"
    },
    marginBottom: "0.2rem",
    "&:last-of-type": {
      marginBottom: 0
    }
  }
}));

const HtmlTooltip = withStyles(() => ({
  tooltip: {
    backgroundColor: "#f5f5f9",
    color: darkNavyText,
    maxWidth: "13.75rem",
    fontWeight: "normal",
    fontSize: "0.9375rem",
    border: "1px solid #dadde9"
  }
}))(Tooltip);
