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

import { setSingleData } from "actions/dashboardDataActions";

import CustomHeaderCheckbox from "./custom/CustomHeaderCheckbox";
import CustomToolbar from "./custom/CustomToolbar";
import CustomFooter from "./custom/CustomFooter";
import CustomTitle from "./custom/CustomTitle";
import { xhrRequest2, addAll, removeAll, handleCheckbox } from "utils/helpers";
import { HIGH_LOW } from "./tableTypes";

let selected = [];

const HighLowTable = ({
  setSelectedVin,
  tableSettings,
  dashboardData,
  updateHighLowData,
  getTableData,
}) => {
  const [alertMessage, setAlertMessage] = useState("");
  const [initialRender, setInitialRender] = useState(true);

  let rowsPerPage = dashboardData[HIGH_LOW].rowsPerPage;

  useEffect(() => {
    if (initialRender) {
      setInitialRender(false);
    } else {
      getTableData(HIGH_LOW, 0);
    }
  }, [rowsPerPage, getTableData, initialRender]);

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
    rowsPerPage: dashboardData[HIGH_LOW].rowsPerPage,
    sortOrder: dashboardData[HIGH_LOW].sortOrder,
    count: dashboardData[HIGH_LOW].count,
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
          page={dashboardData[HIGH_LOW].page}
          rowsPerPage={rowsPerPage}
          onChangeRowsPerPage={(event) => changeRowsPerPage(event.target.value)}
          onChangePage={(_, page) => changePage(page)}
          sendMessage={sendBatteryMessage}
          selected={selected}
          alertMessage={alertMessage}
          setAlertMessage={setAlertMessage}
          removeAll={removeAll}
          updateFunc={updateHighLowData}
          currentData={dashboardData}
          keyName={HIGH_LOW}
        />
      );
    },
    onTableChange: (action, tableState) => {
      // a developer could react to change on an action basis or
      // examine the state as a whole and do whatever they want

      switch (action) {
        case "changePage":
          changePage(tableState.page, tableState.sortOrder);
          break;
        case "sort":
          sort(tableState.page, tableState.sortOrder);
          break;
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
              key={HIGH_LOW}
              selected={selected}
              removeAll={removeAll}
              addAll={addAll}
              updateFunc={updateHighLowData}
              currentData={dashboardData}
              keyName={HIGH_LOW}
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
                  updateHighLowData,
                  dashboardData,
                  HIGH_LOW,
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
      name: "currentSOC",
      label: "CURRENT SOC",
      options: {
        customBodyRender: (value) => {
          return `${value}%`;
        },
      },
    },
    {
      name: "avgSOC",
      label: "AVG SOC",
      options: {
        customBodyRender: (value) => {
          return (
            <span
              style={{
                color: value <= tableSettings.battery ? "red" : "black",
              }}
            >
              {value}%
            </span>
          );
        },
      },
    },
  ];

  const changePage = (page, sortOrder) => {
    updateHighLowData(HIGH_LOW, {
      ...dashboardData[HIGH_LOW],
      isLoading: true,
    });
    xhrRequest2(
      // `/myApiServer?page=${page}`,
      HIGH_LOW,
      page,
      dashboardData[HIGH_LOW].rowsPerPage,
      sortOrder
    ).then((res) => {
      updateHighLowData(HIGH_LOW, {
        ...dashboardData[HIGH_LOW],
        isLoading: false,
        page: res.page,
        sortOrder,
        count: res.total,
        data: res.data,
      });
    });
  };

  const sort = (page, sortOrder) => {
    updateHighLowData(HIGH_LOW, {
      ...dashboardData[HIGH_LOW],
      isLoading: true,
    });
    xhrRequest2(
      HIGH_LOW,
      page,
      dashboardData[HIGH_LOW].rowsPerPage,
      sortOrder
    ).then((res) => {
      updateHighLowData(HIGH_LOW, {
        ...dashboardData[HIGH_LOW],
        isLoading: false,
        page: res.page,
        sortOrder,
        count: res.total,
        data: res.data,
      });
    });
  };

  const sendBatteryMessage = async () => {
    if (!selected.length) return;
    //API to send vehiclest to be alerted
    setAlertMessage("Success");
  };

  const getDetails = (vin) => {
    const found = dashboardData[HIGH_LOW].data.find((e) => e.vin === vin);
    console.log("found", found);
    if (found === undefined) {
      alert("error");
    } else {
      setSelectedVin(found);
    }
  };

  return (
    <MUIDataTable
      title={
        <CustomTitle
          state={dashboardData[HIGH_LOW]}
          vehicleCount={208}
          title={"High/Low"}
        />
      }
      data={dashboardData[HIGH_LOW].data}
      columns={batteryColumns}
      options={options}
    />
  );
};

const mapStateToProps = (state) => {
  const { tableSettings, dashboardData } = state;
  return { tableSettings, dashboardData };
};

const mapDispatchToProps = (dispatch) => ({
  updateHighLowData: (keyName, payload) =>
    dispatch(setSingleData(keyName, payload)),
});

HighLowTable.propTypes = {
  setSelectedVin: PropTypes.func.isRequired,
  tableSettings: PropTypes.object.isRequired,
  dashboardData: PropTypes.object.isRequired,
  updateHighLowData: PropTypes.func.isRequired,
  getTableData: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(HighLowTable);
