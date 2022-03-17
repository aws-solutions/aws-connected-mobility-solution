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
import { connect } from "react-redux";
import PropTypes from "prop-types";

import {
  setSingleData,
  getNotChargingTableData,
} from "actions/dashboardDataActions";

import { Checkbox } from "@material-ui/core";
import CustomHeaderCheckbox from "./custom/CustomHeaderCheckbox";
import CustomToolbar from "./custom/CustomToolbar";
import CustomTitle from "./custom/CustomTitle";
import CustomFooter from "./custom/CustomFooter";
import { addAll, removeAll, handleCheckbox } from "utils/helpers";
import { CHARGING } from "./tableTypes";

let selected = [];

const ChargingTable = ({
  setSelectedVin,
  setDetailsType,
  tableSettings,
  dashboardData,
  updateChargingData,
  getNotChargingData,
}) => {
  const [alertMessage, setAlertMessage] = useState("");
  const [initialRender, setInitialRender] = useState(true);

  const chargingRowsPerPage = dashboardData[CHARGING].rowsPerPage;

  const loadCheck = () => {
    if (initialRender) {
      setInitialRender(false);
    } else {
      getNotChargingData(CHARGING);
    }
  };

  useEffect(() => {
    loadCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargingRowsPerPage]);

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
    rowsPerPage: dashboardData[CHARGING].rowsPerPage,
    sortOrder: dashboardData[CHARGING].sortOrder,
    count: dashboardData[CHARGING].count,
    responsive: "standard",
    enableNestedDataAccess: ".",
    customToolbar: () => {
      return (
        <CustomToolbar
          keyName="charging"
          tempKeyName="tempCharging"
          title="not charging settings"
          subTitle="Max Duration w/o Charging"
          measurement="min"
        />
      );
    },
    customFooter: (count, page, rowsPerPage, changeRowsPerPage, changePage) => {
      return (
        <CustomFooter
          count={count}
          page={dashboardData[CHARGING].page}
          rowsPerPage={rowsPerPage}
          onChangeRowsPerPage={(event) => changeRowsPerPage(event.target.value)}
          onChangePage={(_, page) => changePage(page)}
          sendMessage={sendChargingMessage}
          selected={selected}
          alertMessage={alertMessage}
          setAlertMessage={setAlertMessage}
          removeAll={removeAll}
          updateFunc={updateChargingData}
          currentData={dashboardData}
          keyName={CHARGING}
        />
      );
    },
    onTableChange: (action, tableState) => {
      // a developer could react to change on an action basis or
      // examine the state as a whole and do whatever they want

      switch (action) {
        case "changePage":
          // changePage(tableState.page, tableState.sortOrder);
          getNotChargingData(CHARGING, tableState.page);
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

  const chargingColumns = [
    {
      name: "isChecked",
      options: {
        customHeadRender: () => {
          return (
            <CustomHeaderCheckbox
              key={CHARGING}
              selected={selected}
              removeAll={removeAll}
              addAll={addAll}
              updateFunc={updateChargingData}
              currentData={dashboardData}
              keyName={CHARGING}
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
                  updateChargingData,
                  dashboardData,
                  CHARGING,
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
      label: "STATION",
      options: {
        customBodyRender: (value) => {
          return `Station 1`;
        },
      },
    },
    {
      name: "hours",
      label: "DURATION",
      options: {
        customBodyRender: (value) => {
          const time = Math.abs(Math.round(value * 10) / 10);
          return (
            <span
              style={{
                color:
                  time >= parseInt(tableSettings.charging) / 60
                    ? "red"
                    : "black",
              }}
            >
              {time} hours
            </span>
          );
        },
      },
    },
  ];

  // const changePage = (page, sortOrder) => {
  //   console.log("page", page);
  //   updateChargingData(CHARGING, {
  //     ...dashboardData[CHARGING],
  //     isLoading: true,
  //   });
  // };

  // const sort = (page, sortOrder) => {
  //   updateChargingData(CHARGING, {
  //     ...dashboardData[CHARGING],
  //     isLoading: true,
  //   });
  // };

  const sendChargingMessage = async () => {
    console.log("charging selected", selected);
    if (!selected.length) return;
    //API to send vehiclest to be alerted
    setAlertMessage("Success");
  };

  const getDetails = (vin) => {
    const found = dashboardData[CHARGING].data.find((e) => e.vin === vin);
    if (found === undefined) {
      alert("error");
    } else {
      setSelectedVin(found);
      setDetailsType(CHARGING);
    }
  };

  return (
    <MUIDataTable
      title={
        <CustomTitle
          state={dashboardData[CHARGING]}
          vehicleCount={dashboardData[CHARGING].count}
          title={"Not Charging"}
        />
      }
      data={dashboardData[CHARGING].data}
      columns={chargingColumns}
      options={options}
    />
  );
};

const mapStateToProps = (state) => {
  const { tableSettings, dashboardData } = state;
  return { tableSettings, dashboardData };
};

const mapDispatchToProps = (dispatch) => ({
  updateChargingData: (keyName, payload) =>
    dispatch(setSingleData(keyName, payload)),
  getNotChargingData: (type, page) =>
    dispatch(getNotChargingTableData(type, page)),
});

ChargingTable.propTypes = {
  setSelectedVin: PropTypes.func.isRequired,
  setDetailsType: PropTypes.func.isRequired,
  // tableSettings: PropTypes.object.isRequired,
  dashboardData: PropTypes.object.isRequired,
  updateChargingData: PropTypes.func.isRequired,
  getNotChargingData: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(ChargingTable);
