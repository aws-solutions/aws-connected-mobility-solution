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
import PropTypes from "prop-types";
import { connect } from "react-redux";
import moment from "moment";
import clsx from "clsx";
import _get from "lodash.get";
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";
import VirtualListCustomScrollbar from "components/global/VirtualListCustomScrollbar";
import { useIsMounted } from "utils/reactHooks";
import { toGeoJSON } from "@mapbox/polyline";
import { getVehicleTrips, getTripDataById } from "apis/vehicles";
import { makeStyles } from "@material-ui/core/styles";
import { setTripEventDataPromise } from "actions/dataActions";
import { setTripHistoryView } from "actions/viewActions";
import { setUserAlert } from "actions/userActions";
import { zoomToGeoJSON } from "actions/mapActions";
import { darkNavyText, offPink, white, grayVehicleBg } from "assets/colors";
import { buildTripForMap } from "utils/dataHelpers";
import { keys } from "assets/mapbox/tripStyle";
import { validCoordArr } from "utils/geojsonHelpers";

const VehicleTripHistory = ({
  setTripData,
  openTripHistoryView,
  closeTripHistoryView,
  zoomToTripGeoJSON,
  viewport,
  zoomToViewport,
  vin,
  dataCacheRef,
  isParentMounted,
  hasPreviousViewport,
  setAlertMessage
}) => {
  const classes = useStyles();
  const isMounted = useIsMounted();
  const [state, setState] = React.useState({
    loading: true,
    loadingNextPage: false,
    offset: null,
    tripCache: {},
    tripHistory: []
  });
  const [selectedTripIdx, setSelectedTripIdx] = React.useState(null);
  const selectedTripIdxRef = React.useRef();
  const viewportSnapshot = React.useRef();
  const listRef = React.useRef();
  const outerRef = React.useRef();
  const { loading, offset, tripHistory, tripCache, loadingNextPage } = state;
  const hasNextPage = !!offset;
  const listScrollOffset = dataCacheRef.current.tripHistory.scrollOffset || 0;

  const setLoadingNextPage = loadingNextPage =>
    setState(state => ({ ...state, loadingNextPage }));
  const setTripCache = (tripId, tripData) =>
    setState(state => ({
      ...state,
      tripCache: { ...state.tripCache, [tripId]: tripData }
    }));

  const getPaginatedTrips = React.useCallback(
    async ({ initialize, offset: requestOffset = 0 } = {}) => {
      try {
        const { trips = [], offset } = await getVehicleTrips({
          vin,
          offset: requestOffset
        });
        if (isMounted.current) {
          setState(state => ({
            ...state,
            tripHistory: initialize ? trips : [...state.tripHistory, ...trips],
            loading: false,
            offset: offset || null,
            loadingNextPage: false
          }));
        }
      } catch {
        if (isMounted.current) {
          setState(state => ({
            ...state,
            loading: false,
            offset: null,
            loadingNextPage: false
          }));
        }
      }
    },
    [vin, isMounted]
  );

  React.useEffect(() => {
    const { results, tripCache, offset, loading, loadingNextPage } =
      dataCacheRef.current.tripHistory || {};
    if (results) {
      setState(state => ({
        ...state,
        tripHistory: results,
        tripCache,
        loading,
        offset,
        loadingNextPage
      }));
    } else {
      getPaginatedTrips({ initialize: true }).finally(() => {
        if (!isMounted.current) {
          dataCacheRef.current.tripHistory = {};
        }
      });
    }
  }, [isMounted, dataCacheRef, getPaginatedTrips]);

  React.useEffect(() => {
    return () => {
      closeTripHistoryView();
      setTripData(null);

      if (viewportSnapshot.current) {
        const parentMounted = isParentMounted;
        const parentOpen = parentMounted.current;
        if (parentOpen || (!parentOpen && !hasPreviousViewport)) {
          zoomToViewport(viewportSnapshot.current);
        }
      }
    };
  }, [
    isParentMounted,
    zoomToViewport,
    hasPreviousViewport,
    closeTripHistoryView,
    setTripData
  ]);

  React.useEffect(() => {
    const {
      loading,
      offset,
      tripHistory: results,
      tripCache,
      loadingNextPage
    } = state;
    dataCacheRef.current.tripHistory = {
      loading,
      offset,
      results,
      tripCache,
      loadingNextPage
    };
  }, [state, dataCacheRef]);

  const loadNextPage = () => {
    return new Promise(resolve => {
      setLoadingNextPage(true);
      getPaginatedTrips({ offset }).finally(() => {
        if (isMounted.current) {
          setLoadingNextPage(false);
          resolve();
        } else {
          dataCacheRef.current.tripHistory.loadingNextPage = false;
        }
      });
    });
  };

  const itemCount = hasNextPage ? tripHistory.length + 1 : tripHistory.length;
  const loadMoreItems = loadingNextPage ? () => {} : loadNextPage;
  const isItemLoaded = index => !hasNextPage || index < tripHistory.length;

  const scrollHandler = ({ scrollOffset }) => {
    if (listRef.current)
      dataCacheRef.current.tripHistory.scrollOffset = scrollOffset;
  };

  const handleTripClick = (trip, idx) => async () => {
    if (selectedTripIdx === idx) return;

    try {
      setSelectedTripIdx(idx);
      selectedTripIdxRef.current = idx;

      const { tripId } = trip;
      const cachedTrip = tripCache[tripId];
      const tripData = cachedTrip || (await getTripDataById(tripId));
      if (!cachedTrip && isMounted.current) setTripCache(tripId, tripData);

      const polyline = _get(tripData, "geometry");
      const lineStringFeature = toGeoJSON(polyline);
      const coordArr = lineStringFeature.coordinates;

      if (!validCoordArr(coordArr)) throw Error("Invalid trip coordinates");
      if (!viewportSnapshot.current) viewportSnapshot.current = { ...viewport };
      if (coordArr.length === 1) coordArr.push(coordArr[0]);

      const tripPayload = buildTripForMap({ trip, coordArr });
      const tripGeoJSON = tripPayload[keys.tripGeoJSON];

      if (selectedTripIdxRef.current === idx && isMounted.current) {
        setTripData(tripPayload).then(() => {
          openTripHistoryView();
          zoomToTripGeoJSON(tripGeoJSON);
        });
      }
    } catch {
      setAlertMessage({ message: "Error retrieving coordinates of trip" });
      if (isMounted.current) {
        setSelectedTripIdx(null);
        selectedTripIdxRef.current = null;
      }
    }
  };

  const TripRow = React.memo(({ index, style }) => {
    const notLoaded = !isItemLoaded(index);
    const trip = tripHistory[index] || {};
    const { startTime, duration, distance = {}, fuelEconomy = {} } = trip;
    const isSelected = index === selectedTripIdx;
    const isEven = (index + 1) % 2 === 0;
    return (
      <div
        className={clsx(classes.tripRow, {
          [classes.evenTripRow]: isEven,
          [classes.selectedTripRow]: isSelected,
          [classes.loadingRow]: notLoaded,
          [classes.tripRowHover]: !notLoaded
        })}
        key={index}
        style={style}
        onClick={notLoaded ? () => null : handleTripClick(trip, index)}
      >
        {notLoaded ? (
          "Loading..."
        ) : (
          <>
            <div className={classes.date}>
              {moment(startTime).format("MMM D")}
            </div>
            <div className={classes.start}>
              {moment(startTime).format("hh:mm a")}
            </div>
            <div className={classes.duration}>
              {Number(duration).toFixed(2)}
            </div>
            <div className={classes.distance}>
              {Number(distance.miles).toFixed(2)}
            </div>
            <div className={classes.mpg}>
              {Number(fuelEconomy.mpg).toFixed(2)}
            </div>
          </>
        )}
      </div>
    );
  });

  if (loading) return <div style={{ textAlign: "center" }}>Loading...</div>;
  if (!loading && !tripHistory.length)
    return <div style={{ textAlign: "center" }}>No trip history</div>;

  return (
    <div className={classes.container}>
      <div className={classes.headerBar}>
        <div className={classes.date}>DATE</div>
        <div className={classes.start}>START TIME</div>
        <div className={classes.duration}>DURATION</div>
        <div className={classes.distance}>DISTANCES (MILES)</div>
        <div className={classes.mpg}>AVG MPG</div>
      </div>
      <div className={classes.tripsContainer}>
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader
              threshold={1}
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
              ref={listRef}
            >
              {({ onItemsRendered, ref }) => (
                <FixedSizeList
                  ref={ref}
                  onScroll={scrollHandler}
                  initialScrollOffset={listScrollOffset}
                  className={classes.list}
                  height={height}
                  itemCount={itemCount}
                  onItemsRendered={onItemsRendered}
                  itemSize={35}
                  width={width}
                  outerElementType={VirtualListCustomScrollbar}
                  outerRef={outerRef}
                >
                  {TripRow}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

const mapStateToProps = state => {
  const {
    map: { viewport }
  } = state;
  return { viewport };
};

const mapDispatchToProps = dispatch => ({
  setTripData: tripData => dispatch(setTripEventDataPromise(tripData)),
  zoomToTripGeoJSON: geojson =>
    dispatch(zoomToGeoJSON(geojson, { tripPadding: true })),
  openTripHistoryView: () => dispatch(setTripHistoryView(true)),
  closeTripHistoryView: () => dispatch(setTripHistoryView(false)),
  setAlertMessage: ({ message }) => dispatch(setUserAlert({ message }))
});

VehicleTripHistory.propTypes = {
  vin: PropTypes.string.isRequired,
  dataCacheRef: PropTypes.object.isRequired,
  isParentMounted: PropTypes.object.isRequired,
  hasPreviousViewport: PropTypes.bool
};

export default connect(mapStateToProps, mapDispatchToProps)(VehicleTripHistory);

const highlightedTripRow = {
  backgroundColor: offPink,
  color: white
};

const useStyles = makeStyles(() => ({
  container: {
    height: "100%",
    fontSize: "0.75rem",
    color: darkNavyText,
    backgroundColor: white,
    display: "flex",
    flexDirection: "column"
  },
  headerBar: {
    flex: 0,
    padding: "0 1.4rem",
    height: "1.69rem",
    backgroundColor: darkNavyText,
    opacity: 0.5,
    color: white,
    fontSize: "0.61rem",
    display: "flex",
    alignItems: "center"
  },
  tripsContainer: {
    flex: 1
  },
  tripRow: {
    padding: "0 1.4rem",
    display: "flex",
    alignItems: "center",
    height: "2.16rem",
    color: darkNavyText
  },
  tripRowHover: {
    "&:hover": {
      ...highlightedTripRow,
      cursor: "pointer"
    }
  },
  evenTripRow: {
    backgroundColor: grayVehicleBg
  },
  selectedTripRow: highlightedTripRow,
  loadingRow: {
    justifyContent: "center"
  },
  date: {
    flex: 1.49
  },
  start: {
    flex: 2.16
  },
  duration: {
    flex: 2.07
  },
  distance: {
    flex: 2.77
  },
  mpg: {
    flex: 1
  }
}));
