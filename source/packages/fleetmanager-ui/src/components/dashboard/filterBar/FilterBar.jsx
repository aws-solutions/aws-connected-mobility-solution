import React from "react";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import clsx from "clsx";

import Locations from "./Locations";

const FilterBar = ({
  locationFilter,
  setLocationFilter,
  ignitionFilter,
  setIgnitionFilter,
  vehicleFilter,
  setVehicleFilter,
}) => {
  const classes = useStyles();
  return (
    <div>
      <Paper elevation={0} className={classes.container}>
        <div className={classes.btnsContainer}>
          <Locations
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
          />
          <button className={classes.filterBtn}>Vehicle</button>
          <button className={classes.filterBtn}>Igniton Status</button>
          <button className={clsx(classes.filterBtn, classes.clearBtn)}>
            Clear
          </button>
        </div>
      </Paper>
    </div>
  );
};

export default FilterBar;

const useStyles = makeStyles((theme) => ({
  container: {
    height: 46,
    display: "flex",
    alignItems: "center",
    borderRadius: "0 !important",
  },
  btnsContainer: {
    display: "flex",
    marginLeft: 52,
  },
  filterBtn: {
    marginRight: 16,
    padding: 10,
    border: "none",
    outline: "none",
    borderRadius: 3,
    cursor: "pointer",
    color: "#232F3E",
    fontSize: 12,
  },
  clearBtn: {
    backgroundColor: "white",
  },
}));
