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
import MUIDataTable from "mui-datatables";
import { Checkbox } from "@material-ui/core";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import {
  setSingleData,
  getBatteryTableData,
} from "actions/dashboardDataActions";

import CustomHeaderCheckbox from "./custom/CustomHeaderCheckbox";
import CustomToolbar from "./custom/CustomToolbar";
import CustomFooter from "./custom/CustomFooter";
import CustomTitle from "./custom/CustomTitle";
import { addAll, removeAll, handleCheckbox } from "utils/helpers";
import { BATTERY } from "./tableTypes";

let selected = [];

const BatteryTable = ({
  setSelectedVin,
  setDetailsType,
  tableSettings,
  dashboardData,
  updateBatteryData,
  getBatteryData,
}) => {
  const [alertMessage, setAlertMessage] = useState("");
  const [initialRender, setInitialRender] = useState(true);

  const batteryRowsPerPage = dashboardData[BATTERY].rowsPerPage;

  const loadCheck = () => {
    if (initialRender) {
      setInitialRender(false);
    } else {
      getBatteryData(BATTERY);
    }
  };

  useEffect(() => {
    loadCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batteryRowsPerPage]);

  const options = {
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
    rowsPerPage: dashboardData[BATTERY].rowsPerPage,
    sortOrder: dashboardData[BATTERY].sortOrder,
    count: dashboardData[BATTERY].count,
    responsive: "standard",
    enableNestedDataAccess: ".",
    customToolbar: () => {
      return (
        <CustomToolbar
          keyName="battery"
          tempKeyName="tempBattery"
          title="battery settings"
          subTitle="Min State of Charge"
          measurement="%"
        />
      );
    },
    customFooter: (count, page, rowsPerPage, changeRowsPerPage, changePage) => {
      return (
        <CustomFooter
          count={count}
          page={dashboardData[BATTERY].page}
          rowsPerPage={rowsPerPage}
          onChangeRowsPerPage={(event) => changeRowsPerPage(event.target.value)}
          onChangePage={(_, page) => changePage(page)}
          sendMessage={sendBatteryMessage}
          selected={selected}
          alertMessage={alertMessage}
          setAlertMessage={setAlertMessage}
          removeAll={removeAll}
          updateFunc={updateBatteryData}
          currentData={dashboardData}
          keyName={BATTERY}
        />
      );
    },
    onTableChange: (action, tableState) => {
      // a developer could react to change on an action basis or
      // examine the state as a whole and do whatever they want

      switch (action) {
        case "changePage":
          // changePage(tableState.page, tableState.sortOrder);
          getBatteryData(BATTERY, tableState.page);
          break;
        // case "sort":
        //   sort(tableState.page, tableState.sortOrder);
        //   break;
        default:
          // console.log("action not handled.");
          break;
      }
    },
  };

  const batteryColumns = [
    {
      name: "isChecked",
      options: {
        customHeadRender: () => {
          return (
            <CustomHeaderCheckbox
              key={BATTERY}
              selected={selected}
              removeAll={removeAll}
              addAll={addAll}
              updateFunc={updateBatteryData}
              currentData={dashboardData}
              keyName={BATTERY}
            />
          );
        },
        customBodyRender: (value, tableMeta) => {
          return (
            <Checkbox
              style={{ padding: 0, color: "#3F51B5" }}
              checked={value}
              value={value}
              onChange={() =>
                handleCheckbox(
                  value,
                  tableMeta.rowIndex,
                  tableMeta,
                  updateBatteryData,
                  dashboardData,
                  BATTERY,
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
      name: "current_soc",
      label: "CURRENT SOC",
      options: {
        customBodyRender: (value) => {
          return `${value}%`;
        },
      },
    },
    {
      name: "max_soc",
      label: "MAX SOC",
      options: {
        customBodyRender: (value) => {
          return <span>{value}%</span>;
        },
      },
    },
    {
      name: "min_soc",
      label: "MIN SOC",
      options: {
        customBodyRender: (value) => {
          return (
            <span
              style={{
                color:
                  parseFloat(value) <= parseInt(tableSettings.battery)
                    ? "red"
                    : "black",
              }}
            >
              {value}%
            </span>
          );
        },
      },
    },
  ];

  const sendBatteryMessage = async () => {
    console.log("battery selected", selected);
    if (!selected.length) return;
    //API to send vehiclest to be alerted
    setAlertMessage("Success");
  };

  const getDetails = (vin) => {
    const found = dashboardData[BATTERY].data.find((e) => e.vin === vin);
    // console.log("found", found);
    if (found === undefined) {
      alert("error");
    } else {
      setSelectedVin(found);
      setDetailsType(BATTERY);
    }
  };

  return (
    <MUIDataTable
      title={
        <CustomTitle
          state={dashboardData[BATTERY]}
          vehicleCount={dashboardData[BATTERY].count}
          title={"Low EV Battery"}
        />
      }
      data={dashboardData[BATTERY].data}
      columns={batteryColumns}
      options={options}
    />
  );
};

const mapStateToProps = (state) => {
  const { tableSettings, dashboardData, dashboardFilters } = state;
  return { tableSettings, dashboardData, dashboardFilters };
};

const mapDispatchToProps = (dispatch) => ({
  updateBatteryData: (keyName, payload) =>
    dispatch(setSingleData(keyName, payload)),
  getBatteryData: (type, page) => dispatch(getBatteryTableData(type, page)),
});

BatteryTable.propTypes = {
  setSelectedVin: PropTypes.func.isRequired,
  setDetailsType: PropTypes.func.isRequired,
  tableSettings: PropTypes.object.isRequired,
  dashboardData: PropTypes.object.isRequired,
  updateBatteryData: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(BatteryTable);
