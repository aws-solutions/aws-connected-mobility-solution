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
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  useAnimationFrameInterval,
  useLoadMapboxToken
} from "utils/reactHooks";
import MapGL, { Source, Layer, FlyToInterpolator } from "react-map-gl";
import { connect } from "react-redux";
import { timer as d3timer } from "d3-timer";
import { geoInterpolate } from "d3-geo";
import debounce from "lodash.debounce";
import _get from "lodash.get";
import turfBearing from "@turf/bearing";
import AnomalyButtonsOverlay from "./AnomalyButtons";
import SearchOnMapMoveOverlay from "./SearchMapMove";
import ResetMapButtonOverlay from "./ResetMapButton";
import InvalidTokenWarning from "./InvalidTokenWarning";
import MapZoomButtons from "./MapZoomButtons";
import {
  setMapViewport,
  setMapBoundary,
  zoomToGeoJSON
} from "actions/mapActions";
import { setSingleVehicleViewOpen } from "actions/viewActions";
import {
  setSelectedVehicleData,
  refreshVehicles,
  setFilteredWorldVehicles
} from "actions/dataActions";
import { setUserAlert } from "actions/userActions";
import { getSingleVehicle } from "apis/vehicles";
import { formatResultsToGeoJSON, reformatVehicle } from "utils/dataHelpers";
import bboxPolygon from "@turf/bbox-polygon";
import vehiclesLayersArr from "assets/mapbox/vehiclesLayersArr";
import clustersLayersArr from "assets/mapbox/clustersLayersArr";
import { getZoomDuration } from "utils/mapHelpers";
import {
  ZOOMED_IN_THRESHOLD,
  ZOOMED_UPDATE_INTERVAL,
  DEFAULT_UPDATE_INTERVAL
} from "assets/appConfig";
import {
  MAP_SOURCE_VEHICLES,
  MAP_LAYER_VEHICLES_CLUSTER,
  MAP_LAYER_VEHICLES_SINGLE,
  ICON_EVENT_MARKER,
  ICON_TRIP_END_MARKER,
  ICON_PRIME_VAN,
  MAP_SOURCE_CLUSTERS,
  MAP_LAYER_CLUSTER,
  MAP_LAYER_COMBINED_CLUSTER,
  MAP_LAYER_CLUSTER_SINGLE_VEHICLE
} from "assets/mapbox/names";
import "mapbox-gl/dist/mapbox-gl.css";
import "assets/css/customMapbox.css";

const TripInfoBox = React.lazy(() => import("./TripInfoBox"));
const emptyGeoJSON = formatResultsToGeoJSON([]);
const clustersMaxZoom = Math.floor(ZOOMED_IN_THRESHOLD);

const FleetMap = ({
  MAPBOX_TOKEN,
  updateViewport,
  geoJSONZoom,
  viewport,
  setVehicleData,
  openSingleVehicleView,
  setCurrMapBoundary,
  tripHistoryView,
  tripEventData,
  mapClusters,
  mapVehicles,
  searchOnMapMove,
  validMapboxToken,
  getLatestVehicles,
  getAllVehicles,
  setAlertMessage
}) => {
  const [vehiclesGeoJSON, setVehiclesGeoJSON] = useState(emptyGeoJSON);
  const [clustersGeoJSON, setClustersGeoJSON] = useState(emptyGeoJSON);
  const [showTripBox, setShowTripBox] = useState(false);
  const mapRef = useRef();
  const mapLoadedRef = useRef(false);
  const timerRef = useRef(null);
  const zoomedInRef = useRef(false);
  const inTransitionRef = useRef(false);
  const loadingToken = useLoadMapboxToken();

  const fetchVehicles = useCallback(
    debounce(options => {
      const inTransition = inTransitionRef.current;
      if (!inTransition) getLatestVehicles(options);
    }, 150),
    [getLatestVehicles]
  );

  const mapChangeHandler = useCallback(
    debounce(() => {
      const map = mapRef.current;
      const mapLoaded = mapLoadedRef.current;
      inTransitionRef.current = false;

      if (tripHistoryView) return setShowTripBox(true);
      if (!map || !mapLoaded) return;
      if (searchOnMapMove) {
        const { _ne, _sw } = map.getBounds();
        const currBbox = [_sw.lng, _sw.lat, _ne.lng, _ne.lat];
        setCurrMapBoundary(currBbox);
      }

      fetchVehicles({ mapOnly: searchOnMapMove ? false : true });
    }, 150),
    [tripHistoryView, searchOnMapMove, setCurrMapBoundary, fetchVehicles]
  );

  const viewStateChangeHandler = ({ viewState, interactionState = {} }) => {
    inTransitionRef.current = !!interactionState.inTransition;
    zoomedInRef.current = viewState.zoom >= ZOOMED_IN_THRESHOLD;
    mapChangeHandler();
  };

  const mapLoadHandler = () => {
    mapLoadedRef.current = true;
    getAllVehicles();

    const map = mapRef.current;
    map.loadImage("/assets/img/end-marker.png", (error, image) => {
      if (error) throw error;
      map.addImage(ICON_TRIP_END_MARKER, image);
    });
    map.loadImage("/assets/img/warning-marker.png", (error, image) => {
      if (error) throw error;
      map.addImage(ICON_EVENT_MARKER, image);
    });
    map.loadImage("/assets/img/prime-van.png", (error, image) => {
      if (error) throw error;
      map.addImage(ICON_PRIME_VAN, image);
    });
  };

  const setOpenSingleVehicleView = vehicle => {
    setVehicleData(vehicle);
    openSingleVehicleView();
  };

  const mapRefHandler = ref => (mapRef.current = ref && ref.getMap());
  const viewportChangeHandler = viewport => updateViewport(viewport);
  const mapResizeHandler = ({ width, height }) => {
    updateViewport({ ...viewport, width, height });
    mapChangeHandler();
  };

  const clusterClickHandler = (cluster, mapSouceName) => {
    const map = mapRef.current;
    const clusterId = cluster[0].properties.cluster_id;
    map
      .getSource(mapSouceName)
      .getClusterExpansionZoom(clusterId, (err, newZoom) => {
        if (err) return;
        const [longitude, latitude] = cluster[0].geometry.coordinates;
        const transitionDuration = getZoomDuration(viewport.zoom, newZoom);

        updateViewport({
          ...viewport,
          zoom: newZoom + 2,
          longitude,
          latitude,
          transitionInterpolator: new FlyToInterpolator({ speed: 5 }),
          transitionDuration
        });
      });
  };

  const mapClickHandler = e => {
    if (tripHistoryView) return;
    const map = mapRef.current;
    const zoomedIn = zoomedInRef.current;

    if (zoomedIn) {
      const singleVehicle = map.queryRenderedFeatures(e.point, {
        layers: [MAP_LAYER_VEHICLES_SINGLE]
      });
      if (singleVehicle.length) {
        const { properties, geometry } = singleVehicle[0];
        const coordinates = [...geometry.coordinates];
        return setOpenSingleVehicleView({ properties, coordinates });
      }

      const cluster = map.queryRenderedFeatures(e.point, {
        layers: [MAP_LAYER_VEHICLES_CLUSTER]
      });
      if (cluster.length) {
        clusterClickHandler(cluster, MAP_SOURCE_VEHICLES);
      }
    } else {
      const combinedCluster = map.queryRenderedFeatures(e.point, {
        layers: [MAP_LAYER_COMBINED_CLUSTER]
      });
      if (combinedCluster.length) {
        return clusterClickHandler(combinedCluster, MAP_SOURCE_CLUSTERS);
      }

      const singleCluster = map.queryRenderedFeatures(e.point, {
        layers: [MAP_LAYER_CLUSTER]
      });
      if (singleCluster.length) {
        const { properties } = singleCluster[0];
        const clusterBounds = JSON.parse(properties.bbox);
        const clusterGeoJSON = bboxPolygon(clusterBounds);
        return geoJSONZoom(clusterGeoJSON);
      }

      const clusterSingleVehicle = map.queryRenderedFeatures(e.point, {
        layers: [MAP_LAYER_CLUSTER_SINGLE_VEHICLE]
      });
      if (clusterSingleVehicle.length) {
        const { properties } = clusterSingleVehicle[0];
        const vin = _get(properties, "vin");
        getSingleVehicle(vin)
            .then(vehicle => {
              const formattedVehicleData = reformatVehicle(vehicle);
              setOpenSingleVehicleView(formattedVehicleData);
            })
            .catch(() => {
              setAlertMessage({ message: "Error retrieving vehicle data" });
            });
      }
    }
  };

  const updateMapWithNewVehicles = vehicleResultsArr => {
    const geoJSON = formatResultsToGeoJSON(vehicleResultsArr);
    setVehiclesGeoJSON(geoJSON);
  };

  const stopTimer = () => timerRef.current && timerRef.current.stop();

  const animationFrame = useCallback(
    vehicleResultsArr => elapsedTime => {
      const rangePosition = elapsedTime / ZOOMED_UPDATE_INTERVAL;
      if (rangePosition > 1) return stopTimer();

      const interpolatedVehicles = vehicleResultsArr.map(vehicle => {
        return {
          ...vehicle,
          coordinates: vehicle.interpolate(rangePosition)
        };
      });
      updateMapWithNewVehicles(interpolatedVehicles);
    },
    []
  );

  const animationHandler = useCallback(
    vehicleResultsArr => {
      const zoomedIn = zoomedInRef.current;
      if (!zoomedIn) {
        stopTimer();
        return updateMapWithNewVehicles(vehicleResultsArr);
      }

      const noVehiclesMoved = vehicleResultsArr.every(
        ({ isNewLocation }) => isNewLocation === false
      );

      if (noVehiclesMoved) {
        updateMapWithNewVehicles(vehicleResultsArr);
      } else {
        stopTimer();
        const vehiclesWithGeoInterpolate = vehicleResultsArr.map(vehicle => {
          const {
            prevLocation,
            coordinates: currLocation,
            properties,
            isNewLocation
          } = vehicle;
          return {
            ...vehicle,
            interpolate: geoInterpolate(prevLocation, currLocation),
            properties: {
              ...properties,
              heading: isNewLocation
                ? turfBearing(prevLocation, currLocation, { final: true })
                : properties.heading
            }
          };
        });
        timerRef.current = d3timer(animationFrame(vehiclesWithGeoInterpolate));
      }
    },
    [animationFrame]
  );

  useEffect(() => {
    const zoomedIn = zoomedInRef.current;
    const inTransition = inTransitionRef.current;
    if (zoomedIn && !inTransition) {
      animationHandler(mapVehicles);
    }
  }, [mapVehicles, animationHandler]);

  useEffect(() => {
    const zoomedIn = zoomedInRef.current;
    const inTransition = inTransitionRef.current;
    if (!zoomedIn && !inTransition) {
      setClustersGeoJSON(formatResultsToGeoJSON(mapClusters));
    }
  }, [mapClusters]);

  useEffect(() => {
    if (!tripHistoryView) setShowTripBox(false);
  }, [tripHistoryView]);

  useAnimationFrameInterval(
    () => {
      mapLoadedRef.current && fetchVehicles({ mapOnly: true });
    },
    zoomedInRef.current ? ZOOMED_UPDATE_INTERVAL : DEFAULT_UPDATE_INTERVAL
  );

  const renderTripInfo = () => {
    if (tripEventData && tripEventData.isTrip) {
      return (
        <React.Suspense fallback={<div />}>
          <TripInfoBox tripData={tripEventData} />
        </React.Suspense>
      );
    } else return null;
  };

  if (loadingToken) return null;
  if (!loadingToken && !validMapboxToken) return <InvalidTokenWarning />;
  return (
    <>
      <AnomalyButtonsOverlay />
      <SearchOnMapMoveOverlay />
      <ResetMapButtonOverlay />
      <MapGL
        {...viewport}
        mapboxApiAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onViewportChange={viewportChangeHandler}
        width="100%"
        height="100%"
        ref={mapRefHandler}
        onClick={mapClickHandler}
        onViewStateChange={viewStateChangeHandler}
        onResize={mapResizeHandler}
        onLoad={mapLoadHandler}
        dragRotate={false}
        touchRotate={false}
        interactiveLayerIds={
          tripHistoryView
            ? []
            : zoomedInRef.current
            ? [MAP_LAYER_VEHICLES_SINGLE, MAP_LAYER_VEHICLES_CLUSTER]
            : [
                MAP_LAYER_CLUSTER_SINGLE_VEHICLE,
                MAP_LAYER_CLUSTER,
                MAP_LAYER_COMBINED_CLUSTER
              ]
        }
      >
        <MapZoomButtons onViewportChange={viewportChangeHandler} />
        {tripHistoryView && showTripBox && renderTripInfo()}
        {!tripHistoryView && (
          <>
            <Source
              id={MAP_SOURCE_VEHICLES}
              key={MAP_SOURCE_VEHICLES}
              type="geojson"
              data={vehiclesGeoJSON}
              cluster={true}
              clusterMaxZoom={23}
              clusterRadius={30}
            />
            <Source
              id={MAP_SOURCE_CLUSTERS}
              key={MAP_SOURCE_CLUSTERS}
              type="geojson"
              data={clustersGeoJSON}
              cluster={true}
              clusterMaxZoom={clustersMaxZoom}
              clusterRadius={30}
              clusterProperties={{ total_count: ["+", ["get", "count"]] }}
            />
            {zoomedInRef.current
              ? vehiclesLayersArr.map(props => (
                  <Layer {...props} key={props.id} />
                ))
              : clustersLayersArr.map(props => (
                  <Layer {...props} key={props.id} />
                ))}
          </>
        )}
        {tripHistoryView && tripEventData && (
          <>
            {tripEventData.sources.map(({ dataKey, id }) => (
              <Source
                type="geojson"
                data={tripEventData[dataKey]}
                id={id}
                key={id}
              />
            ))}
            {tripEventData.layers.map(({ id, ...props }) => (
              <Layer {...props} key={id} />
            ))}
          </>
        )}
      </MapGL>
    </>
  );
};

const mapDispatch = dispatch => ({
  updateViewport: viewport => dispatch(setMapViewport(viewport)),
  geoJSONZoom: geoJSON => dispatch(zoomToGeoJSON(geoJSON)),
  setVehicleData: vehicle => dispatch(setSelectedVehicleData(vehicle)),
  openSingleVehicleView: () => dispatch(setSingleVehicleViewOpen()),
  setCurrMapBoundary: bboxArr => dispatch(setMapBoundary(bboxArr)),
  getLatestVehicles: options => dispatch(refreshVehicles(options)),
  getAllVehicles: () => dispatch(setFilteredWorldVehicles({ appLoad: true })),
  setAlertMessage: ({ message }) => dispatch(setUserAlert({ message }))
});

const mapState = state => {
  const {
    map: { viewport, MAPBOX_TOKEN, validMapboxToken, searchOnMapMove },
    data: { tripEventData, mapVehicles, mapClusters },
    views: { tripHistoryView }
  } = state;
  return {
    viewport,
    MAPBOX_TOKEN,
    tripHistoryView,
    tripEventData,
    mapVehicles,
    searchOnMapMove,
    validMapboxToken,
    mapClusters
  };
};

export default connect(mapState, mapDispatch)(FleetMap);
