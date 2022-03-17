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
import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import PropTypes from "prop-types";

const CustomBarChart = ({ data, title, measurement }) => {
  const classes = useStyles();
  const [dataKeys, setDataKeys] = useState([]);

  useEffect(() => {
    if (data.length) {
      let keys = Object.keys(data[0]);
      keys.shift();
      setDataKeys(keys);
    }
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active) {
      return (
        <div className={classes.tootipContainer}>
          <p className={classes.label}>{`Week ${label}`}</p>
          {payload &&
            payload.map((p, idx) => (
              <p
                key={idx}
                className={classes.line}
                style={{ color: `${p.stroke}` }}
              >{`${p.name.replace(/_/g, " ")}: ${p.value}`}</p>
            ))}
        </div>
      );
    }

    return null;
  };

  const renderLegend = (props) => {
    const { payload } = props;

    return (
      <div className={classes.legendContainer}>
        <div className={classes.legendTitle}>Legend</div>
        <ul className={classes.legend}>
          {payload.map((entry, index) => (
            <li
              key={`item-${index}`}
              style={{ color: `${entry.color}` }}
              className={classes.legendItem}
            >
              {entry.value.replace(/_/g, " ")}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div>
      <div className={classes.container}>
        <div className={classes.header}>
          <h1>{title}</h1>
          <h5>{measurement}</h5>
        </div>
        <div className={classes.chartContainer}>
          <BarChart width={400} height={300} data={data}>
            <XAxis
              dataKey="week"
              tickFormatter={(label) => `Week ${label}`}
              tick={{ fontSize: 12 }}
              stroke="#BBC0C1"
            />
            <YAxis tick={{ fontSize: 12 }} stroke="#BBC0C1" />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.length &&
              dataKeys.map((key, idx) => {
                return <Bar key={idx} dataKey={key} fill="#3F51B5" />;
              })}
            <Legend content={renderLegend} />
          </BarChart>
        </div>
      </div>
    </div>
  );
};

CustomBarChart.propTypes = {
  data: PropTypes.array.isRequired,
  title: PropTypes.string.isRequired,
  measurement: PropTypes.string.isRequired,
};

export default CustomBarChart;

const useStyles = makeStyles((theme) => ({
  container: {
    width: 450,
  },
  header: {
    height: 80,
    backgroundColor: "#222f3e",
    color: "white",
    padding: 16,
    borderRadius: "4px 4px 0 0",
    "& > h1": {
      margin: 0,
      fontSize: 24,
    },
    "& > h5": {
      margin: 0,
      fontSize: 14,
      fontWeight: "normal",
    },
  },
  chartContainer: {
    height: 333,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    borderBottom: "1px solid lightgray",
    borderRight: "1px solid lightgray",
    borderLeft: "1px solid lightgray",
    borderRadius: "0 0 4px 4px",
  },
  tootipContainer: {
    backgroundColor: "white",
    border: "1px solid lightgray",
    padding: 10,
  },
  label: {
    margin: "3px 3px 5px 3px",
    fontWeight: 700,
  },
  line: {
    textTransform: "capitalize",
    margin: 3,
  },
  legendContainer: {
    marginTop: 30,
  },
  legendTitle: {
    fontSize: 14,
    marginLeft: 40,
    fontWeight: 500,
  },
  legend: {
    display: "flex",
    justifyContent: "space-between",
  },
  legendItem: {
    textTransform: "capitalize",
    listStyleType: "none",
    fontSize: 12,
  },
}));
