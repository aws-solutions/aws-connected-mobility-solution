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
import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Carousel from "react-elastic-carousel";
import PropTypes from "prop-types";

import TireTable from "./TireTable";
import BatteryTable from "./BatteryTable";
import ChargingTable from "./ChargingTable";
import EfficiencyTable from "./EfficiencyTable";
// import HighLowTable from "./HighLowTable";

const TablesContainer = ({ setSelectedVin, setDetailsType }) => {
  const classes = useStyles();
  const [expand, setExpand] = useState(false);

  const breakpoints = [
    { width: 10, itemsToShow: 1 },
    { width: 1100, itemsToShow: 2 },
    { width: 1655, itemsToShow: 3 },
  ];

  const expandedBreakpoints = [{ width: 1910, itemsToShow: 1 }];

  const items = [
    <div key="1" className={classes.tableContainer}>
      <TireTable
        expand={expand}
        setExpand={setExpand}
        setSelectedVin={setSelectedVin}
        setDetailsType={setDetailsType}
      />
    </div>,
    <div key="2" className={classes.tableContainer}>
      <BatteryTable
        setSelectedVin={setSelectedVin}
        setDetailsType={setDetailsType}
      />
    </div>,
    <div key="3" className={classes.tableContainer}>
      <ChargingTable
        setSelectedVin={setSelectedVin}
        setDetailsType={setDetailsType}
      />
    </div>,
    <div key="4" className={classes.tableContainer}>
      <EfficiencyTable
        setSelectedVin={setSelectedVin}
        setDetailsType={setDetailsType}
      />
    </div>,
    // <div key="5" className={classes.tableContainer}>
    //   <HighLowTable
    //     setSelectedVin={setSelectedVin}
    //     getTableData={getTableData}
    //   />
    // </div>,
  ];

  const expandedItem = [
    <div key="1">
      <TireTable
        expand={expand}
        setExpand={setExpand}
        setSelectedVin={setSelectedVin}
        setDetailsType={setDetailsType}
      />
    </div>,
  ];

  return (
    <Carousel
      breakPoints={expand ? expandedBreakpoints : breakpoints}
      showArrows={!expand}
    >
      {expand ? expandedItem : items}
    </Carousel>
  );
};

TablesContainer.propTypes = {
  setSelectedVin: PropTypes.func.isRequired,
  setDetailsType: PropTypes.func.isRequired,
};

export default TablesContainer;

const useStyles = makeStyles((theme) => ({
  tableContainer: {
    margin: "0 10px 5px 10px",
    width: "100%",
  },
}));
