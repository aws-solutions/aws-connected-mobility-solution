import React from "react";
import PropTypes from "prop-types";
import { CircularProgress } from "@material-ui/core";

const CustomTitle = ({ state, vehicleCount, title }) => {
  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ fontFamily: "AmazonEmber", fontWeight: 700, fontSize: 24 }}>
        {title}
        {state.isLoading && (
          <CircularProgress
            size={24}
            style={{
              marginLeft: 15,
              position: "relative",
              top: 4,
              color: "white",
            }}
          />
        )}
      </div>
      <div style={{ fontFamily: "AmazonEmber", fontWeight: 200, fontSize: 14 }}>
        {vehicleCount} vehicles
      </div>
    </div>
  );
};

CustomTitle.propTypes = {
  state: PropTypes.object.isRequired,
  vehicleCount: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
};

export default CustomTitle;
