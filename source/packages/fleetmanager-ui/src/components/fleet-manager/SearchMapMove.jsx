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
import { connect } from "react-redux";
import Checkbox from "components/global/Checkbox";
import { setSearchOnMapMove } from "actions/mapActions";
import { makeStyles } from "@material-ui/core/styles";
import { boxShadowColor, white } from "assets/colors";
import { mapControls } from "assets/dimensions";

const SearchMapMove = ({ searchOnMapMove, setMapMove, tripHistoryView }) => {
  const classes = useStyles();
  const checkboxHandler = e => setMapMove(e.target.checked);

  if (tripHistoryView) return null;
  return (
    <div
      className={classes.overlayContainer}
      onClick={setMapMove(!searchOnMapMove)}
    >
      <Checkbox
        type="checkbox"
        checked={searchOnMapMove}
        onChange={checkboxHandler}
      />
      Search as I move the map
    </div>
  );
};

const mapStateToProps = state => {
  const {
    views: { tripHistoryView },
    map: { searchOnMapMove }
  } = state;
  return { searchOnMapMove, tripHistoryView };
};

const mapDispatchToProps = dispatch => ({
  setMapMove: checked => () => dispatch(setSearchOnMapMove(checked))
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchMapMove);

const { topOffset, rightOffset, _MAPBOX_ZOOM_BUTTONS_WIDTH } = mapControls;

const useStyles = makeStyles(() => ({
  overlayContainer: {
    position: "absolute",
    top: topOffset,
    right: `calc(${rightOffset} + ${_MAPBOX_ZOOM_BUTTONS_WIDTH} + 1.25rem)`,
    display: "flex",
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
    alignItems: "center",
    zIndex: 1,
    height: "2.5rem",
    fontSize: "0.75rem",
    borderRadius: "0.44rem",
    background: white,
    padding: "0 1rem",
    boxShadow: `0 0.47rem 1.4rem ${boxShadowColor}`,
    userSelect: "none",
    overflow: "hidden",
    "&:hover": {
      cursor: "pointer"
    }
  }
}));
