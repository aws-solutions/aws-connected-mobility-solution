import React from "react";
import { connect } from "react-redux";

import { updateIgnitionFilters } from "actions/dashboardFiltersActions";

import StyledCheckbox from "components/global/Checkbox";

const IgnitionFilter = ({
  dashboardFilters,
  setIgnitionFilters,
  resetIgnitionFilters,
}) => {
  const on = dashboardFilters.ignition.on;

  const handleFilterCheckbox = (e) => {
    const name = e.target.name;
    setIgnitionFilters(name);
  };

  return (
    <div>
      <div>
        <StyledCheckbox
          name="on"
          checked={on}
          onChange={handleFilterCheckbox}
        />
        On
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { dashboardFilters } = state;
  return { dashboardFilters };
};

const mapDispatchToProps = (dispatch) => ({
  setIgnitionFilters: (keyName) => dispatch(updateIgnitionFilters(keyName)),
  resetIgnitionFilters: () => dispatch(),
});

export default connect(mapStateToProps, mapDispatchToProps)(IgnitionFilter);
