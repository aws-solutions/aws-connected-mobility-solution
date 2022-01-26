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
import { makeStyles } from "@material-ui/core/styles";
import ResetIcon from "@material-ui/icons/Replay";
import { zoomOutToWorldView } from "actions/mapActions";
import { mapControls } from "assets/dimensions";

const ResetMapButton = ({ zoomOut }) => {
  const [zoomingOut, setZoomingOut] = React.useState(false);
  const classes = useStyles();

  const resetMapHandler = () => {
    if (!zoomingOut) {
      setZoomingOut(true);
      zoomOut().then(() => setZoomingOut(false));
    }
  };

  return (
    <div
      className={`mapboxgl-ctrl mapboxgl-ctrl-group ${classes.root}`}
      onClick={resetMapHandler}
    >
      <button className="mapboxgl-ctrl-icon">
        <ResetIcon fontSize="inherit" />
      </button>
    </div>
  );
};

const mapDispatchToProps = dispatch => ({
  zoomOut: () => dispatch(zoomOutToWorldView())
});

export default connect(null, mapDispatchToProps)(ResetMapButton);

const {
  topOffset,
  rightOffset,
  _MAPBOX_ZOOM_BUTTONS_HEIGHT,
  _MAPBOX_ZOOM_BUTTONS_WIDTH
} = mapControls;

const useStyles = makeStyles(() => ({
  root: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    top: `calc(${topOffset} + ${_MAPBOX_ZOOM_BUTTONS_HEIGHT} + 2px)`,
    right: rightOffset,
    width: _MAPBOX_ZOOM_BUTTONS_WIDTH,
    height: "30px",
    borderTopRightRadius: "0 !important",
    borderTopLeftRadius: "0 !important",
    zIndex: 1,
    "&:hover": {
      cursor: "pointer"
    },
    "& > button": {
      height: "100%",
      display: "flex !important",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "1.3rem"
    },
    "&:before": {
      display: "block",
      content: `"\\00a0"`,
      width: _MAPBOX_ZOOM_BUTTONS_WIDTH,
      height: "2px",
      marginTop: "-2px",
      backgroundColor: "#dddddd"
    }
  }
}));
