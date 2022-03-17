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
import { makeStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import clsx from "clsx";

const TabsBtns = ({ selectedTab, setSelectedTab }) => {
  const classes = useStyles();

  const handleBtnClick = (e) => {
    setSelectedTab(e.target.name);
  };
  return (
    <div className={classes.btnsContainer}>
      <button
        className={clsx(
          classes.btn,
          selectedTab === "general" ? classes.selected : null
        )}
        name="general"
        onClick={handleBtnClick}
      >
        General
      </button>
      <button
        className={clsx(
          classes.btn,
          selectedTab === "tires" ? classes.selected : null
        )}
        name="tires"
        onClick={handleBtnClick}
      >
        Tires
      </button>
      <button
        className={clsx(
          classes.btn,
          selectedTab === "battery" ? classes.selected : null
        )}
        name="battery"
        onClick={handleBtnClick}
      >
        Battery
      </button>
    </div>
  );
};

TabsBtns.propTypes = {
  selectedTab: PropTypes.string.isRequired,
  setSelectedTab: PropTypes.func.isRequired,
};

export default TabsBtns;

const useStyles = makeStyles((theme) => ({
  btnsContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 48,
  },
  btn: {
    padding: "5px 10px",
    borderRadius: 3,
    marginRight: 2,
    backgroundColor: "white",
    border: "none",
    fontSize: 13,
    cursor: "pointer",
    outline: "none",
  },
  selected: {
    backgroundColor: "#FF4E8B",
    color: "white",
  },
}));
