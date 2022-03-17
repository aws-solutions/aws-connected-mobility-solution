import React, { useState, useEffect } from "react";
import MUIDataTable from "mui-datatables";
import { Checkbox } from "@material-ui/core";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import {
  setSingleData,
  getEfficencyTableData,
} from "actions/dashboardDataActions";

import CustomHeaderCheckbox from "./custom/CustomHeaderCheckbox";
import CustomToolbar from "./custom/CustomToolbar";
import CustomFooter from "./custom/CustomFooter";
import CustomTitle from "./custom/CustomTitle";
import { addAll, removeAll, handleCheckbox } from "utils/helpers";
import { EFFICIENCY } from "./tableTypes";

let selected = [];

const EfficiencyTable = ({
  setSelectedVin,
  setDetailsType,
  tableSettings,
  dashboardData,
  updateEfficiencyData,
  getEfficiencyData,
}) => {
  const [alertMessage, setAlertMessage] = useState("");
  const [initialRender, setInitialRender] = useState(true);

  const efficiencyRowsPerPage = dashboardData[EFFICIENCY].rowsPerPage;

  const loadCheck = () => {
    if (initialRender) {
      setInitialRender(false);
    } else {
      getEfficiencyData(EFFICIENCY);
    }
  };

  useEffect(() => {
    loadCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [efficiencyRowsPerPage]);

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
    rowsPerPage: dashboardData[EFFICIENCY].rowsPerPage,
    sortOrder: dashboardData[EFFICIENCY].sortOrder,
    count: dashboardData[EFFICIENCY].count,
    responsive: "standard",
    enableNestedDataAccess: ".",
    customToolbar: () => {
      return (
        <CustomToolbar
          keyName="efficiency"
          tempKeyName="tempEfficiency"
          title="efficiency settings"
          subTitle="Minimum Efficiency"
          measurement="kWh/100km"
        />
      );
    },
    customFooter: (count, page, rowsPerPage, changeRowsPerPage, changePage) => {
      return (
        <CustomFooter
          count={count}
          page={dashboardData[EFFICIENCY].page}
          rowsPerPage={rowsPerPage}
          onChangeRowsPerPage={(event) => changeRowsPerPage(event.target.value)}
          onChangePage={(_, page) => changePage(page)}
          sendMessage={sendEfficiencyMessage}
          selected={selected}
          alertMessage={alertMessage}
          setAlertMessage={setAlertMessage}
          removeAll={removeAll}
          updateFunc={updateEfficiencyData}
          currentData={dashboardData}
          keyName={EFFICIENCY}
        />
      );
    },
    onTableChange: (action, tableState) => {
      // a developer could react to change on an action basis or
      // examine the state as a whole and do whatever they want

      switch (action) {
        case "changePage":
          // changePage(tableState.page, tableState.sortOrder);
          getEfficiencyData(EFFICIENCY, tableState.page);
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

  const efficiencyColumns = [
    {
      name: "isChecked",
      options: {
        customHeadRender: () => {
          return (
            <CustomHeaderCheckbox
              key={EFFICIENCY}
              selected={selected}
              removeAll={removeAll}
              addAll={addAll}
              updateFunc={updateEfficiencyData}
              currentData={dashboardData}
              keyName={EFFICIENCY}
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
                  updateEfficiencyData,
                  dashboardData,
                  EFFICIENCY,
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
      name: "efficiency",
      label: "kWh/100KM",
      options: {
        customBodyRender: (value) => {
          return (
            <span
              style={{
                color:
                  Math.round(value) <= tableSettings.efficiency
                    ? "red"
                    : "black",
              }}
            >
              {Math.round(value)}
            </span>
          );
        },
      },
    },
  ];

  const sendEfficiencyMessage = async () => {
    console.log("efficiency selected", selected);
    if (!selected.length) return;
    //API to send vehiclest to be alerted
    setAlertMessage("Success");
  };

  const getDetails = (vin) => {
    const found = dashboardData[EFFICIENCY].data.find((e) => e.vin === vin);
    if (found === undefined) {
      alert("error");
    } else {
      setSelectedVin(found);
      setDetailsType(EFFICIENCY);
    }
  };

  return (
    <MUIDataTable
      title={
        <CustomTitle
          state={dashboardData[EFFICIENCY]}
          vehicleCount={dashboardData[EFFICIENCY].count}
          title={"Efficiency Since Last Charge"}
        />
      }
      data={dashboardData[EFFICIENCY].data}
      columns={efficiencyColumns}
      options={options}
    />
  );
};

const mapStateToProps = (state) => {
  const { tableSettings, dashboardData, dashboardFilters } = state;
  return { tableSettings, dashboardData, dashboardFilters };
};

const mapDispatchToProps = (dispatch) => ({
  updateEfficiencyData: (keyName, payload) =>
    dispatch(setSingleData(keyName, payload)),
  getEfficiencyData: (type, page) =>
    dispatch(getEfficencyTableData(type, page)),
});

EfficiencyTable.propTypes = {
  setSelectedVin: PropTypes.func.isRequired,
  setDetailsType: PropTypes.func.isRequired,
  tableSettings: PropTypes.object.isRequired,
  dashboardData: PropTypes.object.isRequired,
  updateEfficiencyData: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(EfficiencyTable);
