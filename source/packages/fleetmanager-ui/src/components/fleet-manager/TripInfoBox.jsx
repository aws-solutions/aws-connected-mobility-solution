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
import { useIsMounted } from "utils/reactHooks";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Popup } from "react-map-gl";
import bbox from "@turf/bbox";
import { reverseGeocoder } from "apis/mapbox";
import { getGeocoderAddressData } from "utils/dataHelpers";
import { darkNavyText } from "assets/colors";
import { keys } from "assets/mapbox/tripStyle";
import carIcon from "assets/img/car-icon.svg";

const TripInfoBox = ({ tripData = {}, MAPBOX_TOKEN }) => {
  const classes = useStyles();
  const [addressData, setAddressData] = React.useState({});
  const isMounted = useIsMounted();
  const { distance = {}, duration } = tripData;

  const tripGeoJSON = tripData[keys.tripGeoJSON];
  const [minLng, minLat, , maxLat] = bbox(tripGeoJSON);
  const midLat = (minLat + maxLat) / 2;

  const startGeoJSON = tripData[keys.startGeoJSON];
  const startCoordinates = startGeoJSON.geometry.coordinates;
  const endGeoJSON = tripData[keys.endGeoJSON];
  const endCoordinates = endGeoJSON.geometry.coordinates;

  const renderAddress = ({ address, city, state, postcode } = {}) => {
    const cityStatePostcode = `${city ? `${city}, ` : ""}${
      state ? `${state} ` : ""
    }${postcode || ""}`;

    return (
      <>
        <div className="address">{address || "Unknown Address"}</div>
        <div>{cityStatePostcode || "Unknown Area"}</div>
      </>
    );
  };

  const getSetAddress = React.useCallback(
    (coordArr, keyName) => {
      const [long, lat] = coordArr;
      reverseGeocoder({ long, lat, MAPBOX_TOKEN })
        .then(geocoderData => {
          if (isMounted.current) {
            const addressData = getGeocoderAddressData(geocoderData);
            setAddressData(data => ({ ...data, [keyName]: addressData }));
          }
        })
        .catch(() => isMounted.current && setAddressData({}));
    },
    [MAPBOX_TOKEN, isMounted]
  );

  React.useEffect(() => {
    getSetAddress(startCoordinates, "start");
  }, [startCoordinates, getSetAddress]);

  React.useEffect(() => {
    getSetAddress(endCoordinates, "end");
  }, [endCoordinates, getSetAddress]);

  return (
    <Popup
      latitude={midLat}
      longitude={minLng}
      anchor="right"
      dynamicPosition={false}
      closeButton={false}
      tipSize={0}
      offsetLeft={-40}
      offsetTop={-10}
    >
      <div className={classes.wrapper}>
        <div className={classes.container}>
          <div className={`header ${classes.displayFlex}`}>
            <div className={classes.carIcon} />
            <div className={classes.distanceDurationBox}>
              <div className="duration">{Number(duration).toFixed(2)} min</div>
              <div className="distance">
                {Number(distance.miles).toFixed(2)} miles
              </div>
            </div>
          </div>
          <div className={classes.divider} />
          <div className={`startBox ${classes.displayFlex}`}>
            <div className={`${classes.dotsContainer} ${classes.displayFlex}`}>
              <div style={{ flex: 1.7 }}>
                <div className={`${classes.baseDot} ${classes.startDot}`} />
              </div>
              <div className={classes.midDot}>
                <div className="dot" />
              </div>
              <div className={classes.midDot}>
                <div className="dot" />
              </div>
              <div className={classes.midDot}>
                <div className="dot" />
              </div>
            </div>
            <div
              className={`${classes.addressContainer} ${classes.firstAddress}`}
            >
              {renderAddress(addressData.start)}
            </div>
          </div>
          <div className={`endBox ${classes.displayFlex}`}>
            <div className={`${classes.dotsContainer} ${classes.displayFlex}`}>
              <div className={`${classes.baseDot} ${classes.endDot}`} />
            </div>
            <div className={classes.addressContainer}>
              {renderAddress(addressData.end)}
            </div>
          </div>
        </div>
      </div>
    </Popup>
  );
};

const mapStateToProps = state => {
  const {
    map: { MAPBOX_TOKEN }
  } = state;
  return { MAPBOX_TOKEN };
};

TripInfoBox.propTypes = {
  tripData: PropTypes.object.isRequired
};

export default connect(mapStateToProps)(TripInfoBox);

const useStyles = makeStyles(() => ({
  wrapper: {
    width: "13rem",
    display: "block"
  },
  container: {
    margin: "0.875rem 0.875rem 0.5625rem 0.875rem"
  },
  displayFlex: {
    display: "flex"
  },
  carIcon: {
    flex: "0 0 2.25rem",
    height: "2.25rem",
    borderRadius: "50%",
    marginRight: "0.9375rem",
    background: `${darkNavyText} url(${carIcon}) center center no-repeat`,
    backgroundSize: "1.03rem"
  },
  distanceDurationBox: {
    flex: 1,
    color: darkNavyText,
    "& .duration": {
      fontSize: "‭1.125‬rem",
      fontWeight: "bold"
    },
    "& .distance": {
      fontSize: "0.75rem"
    }
  },
  divider: {
    opacity: 0.1,
    height: 1,
    backgroundColor: darkNavyText,
    margin: "1.2rem 0 1.31rem 0"
  },
  dotsContainer: {
    flex: "0 0 2rem",
    marginRight: "0.3rem",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start"
  },
  addressContainer: {
    flex: 1,
    fontSize: "0.75rem",
    "& > .address": {
      fontWeight: "bold",
      marginBottom: "0.2rem"
    }
  },
  firstAddress: {
    paddingBottom: "1.2rem"
  },
  baseDot: {
    marginTop: 4,
    width: 9,
    height: 9,
    borderRadius: "50%"
  },
  startDot: {
    backgroundColor: darkNavyText,
    marginBottom: "0.5rem"
  },
  midDot: {
    flex: 1,
    "& > .dot": {
      opacity: 0.14,
      backgroundColor: darkNavyText,
      width: 5,
      height: 5,
      borderRadius: "50%"
    }
  },
  endDot: {
    border: `0.14rem solid ${darkNavyText}`
  }
}));
