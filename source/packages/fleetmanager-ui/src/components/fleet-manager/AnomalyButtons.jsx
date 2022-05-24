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
import { connect } from "react-redux";
import clsx from "clsx";
import _get from "lodash.get";
import { makeStyles } from "@material-ui/core/styles";
import { setSingleFilter } from "actions/filtersActions";
import { refreshVehicles } from "actions/dataActions";
import { buildOptionUpdatePayload } from "utils/filterHelpers";
import { ANOMALY_COUNT_THRESHOLD } from "assets/appConfig";
import anomalyMappings from "assets/mappings/anomalyMappings";

const AnomalyButtons = ({
  anomalies,
  updateAnomaliesFilter,
  getLatestVehicles
}) => {
  const { options = [] } = anomalies;
  const classes = useStyles();

  const clickHandler = (optionIdx, isActive) => () => {
    if (!isActive) {
      const payload = buildOptionUpdatePayload({
        filterData: anomalies,
        optionIdx,
        selected: true
      });
      updateAnomaliesFilter({ payload });
      setTimeout(getLatestVehicles, 200);
    }
  };

  return (
    <div className={classes.fixedPositionContainer}>
      {options.map((op, idx) => {
        const { id, selected, count, label } = op;
        const iconUrl = _get(anomalyMappings[id], "icon");

        if (count > ANOMALY_COUNT_THRESHOLD)
          return (
            <div
              className={clsx(classes.anomalyButton, {
                [classes.hoverPointer]: !selected
              })}
              key={id}
              onClick={clickHandler(idx, selected)}
            >
              <img
                src={iconUrl}
                alt={label || id}
                style={{ width: "1.125rem" }}
              />
              <div style={{ marginTop: 2, fontSize: "0.75rem" }}>{count}</div>
            </div>
          );
        else return null;
      })}
    </div>
  );
};

const mapStateToProps = state => {
  const {
    filters: { anomalies }
  } = state;
  return { anomalies };
};

const mapDispatchToProps = dispatch => ({
  updateAnomaliesFilter: ({ payload }) =>
    dispatch(setSingleFilter({ payload, keyName: "anomalies" })),
  getLatestVehicles: () => dispatch(refreshVehicles())
});

export default connect(mapStateToProps, mapDispatchToProps)(AnomalyButtons);

const useStyles = makeStyles(() => ({
  fixedPositionContainer: {
    position: "absolute",
    left: "1.875rem",
    bottom: "1.875rem",
    zIndex: 1,
    display: "flex"
  },
  anomalyButton: {
    height: "5.625rem",
    width: "5.625rem",
    borderRadius: "50%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#e02020",
    boxShadow: "0px 0px 30px rgba(224,32,32,0.5)",
    color: "white",
    marginRight: "1rem"
  },
  hoverPointer: {
    cursor: "pointer"
  }
}));
