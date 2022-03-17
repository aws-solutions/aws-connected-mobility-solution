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
import React, { useState, useEffect, useCallback } from "react";
import MUIDataTable from "mui-datatables";
import { Checkbox } from "@material-ui/core";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { setSingleData, getTireTableData } from "actions/dashboardDataActions";

import CustomHeaderCheckbox from "./custom/CustomHeaderCheckbox";
import CustomToolbar from "./custom/CustomToolbar";
import CustomTitle from "./custom/CustomTitle";
import CustomFooter from "./custom/CustomFooter";
import { addAll, removeAll, handleCheckbox } from "utils/helpers";
import { TIRES } from "./tableTypes";

let selected = [];

const TireTable = ({
  expand,
  setExpand,
  setSelectedVin,
  setDetailsType,
  tableSettings,
  dashboardData,
  updateTireData,
  getTireData,
}) => {
  const [alertMessage, setAlertMessage] = useState("");
  const [initialRender, setInitialRender] = useState(true);

  const tiresRowsPerPage = dashboardData[TIRES].rowsPerPage;

  const loadCheck = () => {
    if (initialRender) {
      setInitialRender(false);
    } else {
      getTireData(TIRES);
    }
  };

  useEffect(() => {
    loadCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiresRowsPerPage]);

  const tireColumns = [
    {
      name: "isChecked",
      options: {
        customHeadRender: (columnMeta) => {
          return (
            <CustomHeaderCheckbox
              key={TIRES}
              selected={selected}
              removeAll={removeAll}
              addAll={addAll}
              updateFunc={updateTireData}
              currentData={dashboardData}
              keyName={TIRES}
            />
          );
        },
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <Checkbox
              style={{ padding: 0, color: "#3F51B5" }}
              checked={value}
              // color="primary"
              value={value}
              onChange={() =>
                handleCheckbox(
                  value,
                  tableMeta.rowIndex,
                  tableMeta,
                  updateTireData,
                  dashboardData,
                  TIRES,
                  selected
                )
              }
            />
          );
        },
      },
    },
    {
      name: "vin",
      label: "VIN",
      options: {
        customBodyRender: (value) => {
          const start = value.substring(0, 4);
          const end = value.substr(value.length - 4);
          return (
            <div
              style={{ cursor: "pointer" }}
              onClick={() => getDetails(value)}
            >
              {start}...{end}
            </div>
          );
        },
      },
    },
    {
      name: "vin",
      label: "MIN PSI",
      options: {
        display: !expand,
        customBodyRender: (_, tableMeta) => {
          const rowData = tableMeta.rowData;
          const psiArr = [rowData[5], rowData[7], rowData[9], rowData[11]];
          const min = Math.round(Math.min(...psiArr));
          return (
            <span
              style={{
                color: min <= tableSettings.tirePressure ? "red" : "black",
              }}
            >
              {min}
            </span>
          );
        },
      },
    },
    {
      name: "vin",
      label: "MAX PSI",
      options: {
        display: !expand,
        customBodyRender: (_, tableMeta) => {
          const rowData = tableMeta.rowData;
          const psiArr = [rowData[5], rowData[7], rowData[9], rowData[11]];
          const max = Math.round(Math.max(...psiArr));
          return max;
        },
      },
    },
    {
      name: "vin",
      label: "24hr RoC",
      options: {
        display: !expand,
        customBodyRender: (_, tableMeta) => {
          const rowData = tableMeta.rowData;
          const rocArr = [rowData[6], rowData[8], rowData[10], rowData[12]];
          const max = Math.round(Math.abs(Math.max(...rocArr)));
          return (
            <span
              style={{
                color: max >= tableSettings.roc ? "red" : "black",
              }}
            >
              {max}
            </span>
          );
        },
      },
    },
    {
      name: "pressure_front_right",
      label: "TIRE PRESSURE FR",
      options: {
        display: expand,
        customBodyRender: (value) => {
          return (
            <div style={{ textAlign: "right", width: "70%" }}>
              {Math.round(value)}
            </div>
          );
        },
      },
    },
    {
      name: "roc_front_right",
      label: "RoC (PSI)",
      options: {
        display: expand,
        customBodyRender: (value) => {
          return (
            <div style={{ textAlign: "right", width: "70%" }}>
              {Math.abs(Math.round(value))}
            </div>
          );
        },
      },
    },
    {
      name: "pressure_front_left",
      label: "TIRE PRESSURE FL",
      options: {
        display: expand,
        customBodyRender: (value) => {
          return (
            <div style={{ textAlign: "right", width: "70%" }}>
              {Math.round(value)}
            </div>
          );
        },
      },
    },
    {
      name: "roc_front_left",
      label: "RoC (PSI)",
      options: {
        display: expand,
        customBodyRender: (value) => {
          return (
            <div style={{ textAlign: "right", width: "70%" }}>
              {Math.abs(Math.round(value))}
            </div>
          );
        },
      },
    },
    {
      name: "pressure_rear_right",
      label: "TIRE PRESSURE RR",
      options: {
        display: expand,
        customBodyRender: (value) => {
          return (
            <div style={{ textAlign: "right", width: "70%" }}>
              {Math.round(value)}
            </div>
          );
        },
      },
    },
    {
      name: "roc_rear_right",
      label: "RoC (PSI)",
      options: {
        display: expand,
        customBodyRender: (value) => {
          return (
            <div style={{ textAlign: "right", width: "70%" }}>
              {Math.abs(Math.round(value))}
            </div>
          );
        },
      },
    },
    {
      name: "pressure_rear_left",
      label: "TIRE PRESSURE RL",
      options: {
        display: expand,
        customBodyRender: (value) => {
          return (
            <div style={{ textAlign: "right", width: "70%" }}>
              {Math.round(value)}
            </div>
          );
        },
      },
    },
    {
      name: "roc_rear_left",
      label: "RoC (PSI)",
      options: {
        display: expand,
        customBodyRender: (value) => {
          return (
            <div style={{ textAlign: "right", width: "70%" }}>
              {Math.abs(Math.round(value))}
            </div>
          );
        },
      },
    },
  ];

  const tireOptions = {
    selectableRows: "none",
    search: false,
    sort: false,
    print: false,
    download: false,
    viewColumns: false,
    filter: false,
    serverSide: true,
    fixedHeader: true,
    tableBodyHeight: "530px",
    rowsPerPageOptions: [],
    rowsPerPage: dashboardData[TIRES].rowsPerPage,
    sortOrder: dashboardData[TIRES].sortOrder,
    count: dashboardData[TIRES].count,
    responsive: "standard",
    enableNestedDataAccess: ".",
    customToolbar: () => {
      return (
        <CustomToolbar
          expand={expand}
          expandTable={expandTable}
          keyName="tirePressure"
          tempKeyName="tempTirePressure"
          keyName2="roc"
          tempKeyName2="tempRoc"
          title="tire pressure settings"
          subTitle="min tire pressure"
          subTitle2="max RoC"
          measurement="PSI"
        />
      );
    },
    onTableChange: (action, tableState) => {
      // a developer could react to change on an action basis or
      // examine the state as a whole and do whatever they want

      switch (action) {
        case "changePage":
          // changePage(tableState.page, tableState.sortOrder);
          getTireData(TIRES, tableState.page);
          break;
        // case "sort":
        //   sort(tableState.page, tableState.sortOrder);
        //   break;
        default:
          // console.log("action not handled.");
          break;
      }
    },
    customFooter: (count, page, rowsPerPage, changeRowsPerPage, changePage) => {
      return (
        <CustomFooter
          count={count}
          page={dashboardData[TIRES].page}
          rowsPerPage={rowsPerPage}
          onChangeRowsPerPage={(event) => changeRowsPerPage(event.target.value)}
          onChangePage={(_, page) => changePage(page)}
          sendMessage={sendTiresMessage}
          selected={selected}
          alertMessage={alertMessage}
          setAlertMessage={setAlertMessage}
          removeAll={removeAll}
          updateFunc={updateTireData}
          currentData={dashboardData}
          keyName={TIRES}
        />
      );
    },
  };

  const getDetails = (vin) => {
    const found = dashboardData[TIRES].data.find((e) => e.vin === vin);

    if (found === undefined) {
      alert("error");
    } else {
      setSelectedVin(found);
      setDetailsType(TIRES);
    }
  };

  const sendTiresMessage = () => {
    console.log("tire selected", selected);
    if (!selected.length) return;
    //API to send vehiclest to be alerted
    setAlertMessage("Success");
  };

  const expandTable = () => {
    if (expand) {
      setExpand(false);
    } else {
      setExpand(true);
    }
  };

  return (
    <MUIDataTable
      title={
        <CustomTitle
          state={dashboardData[TIRES]}
          vehicleCount={dashboardData[TIRES].count}
          title={"Low Tire Pressure"}
        />
      }
      data={dashboardData[TIRES].data}
      columns={tireColumns}
      options={tireOptions}
    />
  );
};

const mapStateToProps = (state) => {
  const { tableSettings, dashboardData, dashboardFilters } = state;
  return { tableSettings, dashboardData, dashboardFilters };
};

const mapDispatchToProps = (dispatch) => ({
  updateTireData: (keyName, payload) =>
    dispatch(setSingleData(keyName, payload)),
  getTireData: (type, page) => dispatch(getTireTableData(type, page)),
});

TireTable.propTypes = {
  expand: PropTypes.bool.isRequired,
  setExpand: PropTypes.func.isRequired,
  setSelectedVin: PropTypes.func.isRequired,
  setDetailsType: PropTypes.func.isRequired,
  tableSettings: PropTypes.object.isRequired,
  dashboardData: PropTypes.object.isRequired,
  updateTireData: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(TireTable);
