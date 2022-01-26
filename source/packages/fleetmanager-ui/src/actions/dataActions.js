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
import update from "immutability-helper";
import turfWithin from "@turf/boolean-within";
import turfIntersect from "@turf/intersect";
import bboxPolygon from "@turf/bbox-polygon";
import turfBbox from "@turf/bbox";
import _clone from "lodash.clonedeep";
import _isEqual from "lodash.isequal";
import {
  DATA_SET_OTA_JOBS_LIST,
  DATA_SET_SELECTED_VEHICLE,
  DATA_SET_TRIP_EVENT,
  DATA_SET_VEHICLE_LIST,
  DATA_SET_MAP_CLUSTERS,
  DATA_SET_MAP_VEHICLES,
  DATA_SET_PREVIOUS_LOCATIONS
} from "./types";
import {
  formatGeoJSONForGeoQuery,
  mergeSelectedLocations,
  reformatVehicles,
  formatClustersToGeoJSON,
  reformatFilters,
  getPrevLocation,
  twoUniquePoints,
  validateVehicleCoords,
  buildDeviceExecutionsUpdateObj
} from "utils/dataHelpers";
import { setMultipleFilters, setUpdatedFilters } from "actions/filtersActions";
import { zoomToCustomViewport, zoomToGeoJSON } from "actions/mapActions";
import { getBboxArrayFromViewport } from "utils/mapHelpers";
import { getFilteredVehicles, getClusteredVehicles } from "apis/vehicles";
import {
  defaultState as defaultFilters,
  defaultAnomaliesTroubleCodes
} from "store/reducers/filtersReducer";
import {
  ZOOMED_IN_THRESHOLD,
  SINGLE_FEATURE_ZOOM_LEVEL,
  WORLD_VIEW_GEOJSON
} from "assets/appConfig";

export const setOtaJobsList = ({ jobs = [], nextToken = null }) => ({
  type: DATA_SET_OTA_JOBS_LIST,
  payload: { jobs, nextToken }
});

export const setPaginatedOtaJobsList = ({ jobs = [], nextToken = null }) => {
  return (dispatch, getState) => {
    const {
      data: { otaJobsList }
    } = getState();

    const newFormattedJobs = jobs.map(({ jobId, status }) => ({
      jobId,
      status,
      vehicles: [],
      nextToken: null
    }));

    const { jobs: currJobs } = otaJobsList;
    const updatedJobs = [...currJobs, ...newFormattedJobs];
    dispatch(setOtaJobsList({ jobs: updatedJobs, nextToken }));
  };
};

export const addNewOtaJob = ({ jobId }) => {
  return (dispatch, getState) => {
    const {
      data: { otaJobsList }
    } = getState();

    const newFormattedJob = {
      jobId,
      vehicles: [],
      nextToken: null,
      status: "IN_PROGRESS"
    };
    const { jobs, nextToken } = otaJobsList;
    const updatedJobs = [newFormattedJob, ...jobs];
    dispatch(setOtaJobsList({ jobs: updatedJobs, nextToken }));
  };
};

export const setPaginatedJobDetails = ({
  jobId = "",
  executionSummaries = [],
  nextToken = null
}) => {
  return (dispatch, getState) => {
    const {
      data: { otaJobsList }
    } = getState();

    const jobIndex = otaJobsList.jobs.findIndex(j => jobId === j.jobId);
    const newFormattedDetails = executionSummaries.map(
      ({
        vin,
        thingArn,
        jobExecutionSummary: { lastUpdatedAt, queuedAt, startedAt, status }
      }) => ({
        vin,
        deviceId: thingArn.split("thing/").slice(-1)[0],
        lastUpdatedAt,
        queuedAt,
        startedAt,
        status
      })
    );
    const updatedOtaJobsList = update(otaJobsList, {
      jobs: {
        [jobIndex]: {
          vehicles: {
            $push: newFormattedDetails
          },
          nextToken: {
            $set: nextToken
          }
        }
      }
    });

    dispatch(setOtaJobsList(updatedOtaJobsList));
  };
};

export const updateMultipleDeviceExecutions = ({
  jobId = "",
  executionSummaries = [],
  deviceIndexMap = {}
}) => {
  return (dispatch, getState) => {
    const {
      data: { otaJobsList }
    } = getState();

    const jobIndex = otaJobsList.jobs.findIndex(j => jobId === j.jobId);
    const updateObj = buildDeviceExecutionsUpdateObj({
      executionSummaries,
      deviceIndexMap
    });
    const updatedJobsList = update(otaJobsList, {
      jobs: {
        [jobIndex]: {
          vehicles: {
            ...updateObj
          }
        }
      }
    });

    dispatch(setOtaJobsList(updatedJobsList));
  };
};

export const setSelectedVehicleData = (
  vehicle,
  { fromVehicleList = false } = {}
) => {
  return (dispatch, getState) => {
    if (!vehicle) {
      dispatch({ type: DATA_SET_SELECTED_VEHICLE, payload: null });
    } else {
      const vehicleData = { ...vehicle };
      if (fromVehicleList) {
        const {
          map: {
            viewport: { zoom, longitude: vpLng, latitude: vpLat }
          }
        } = getState();
        if (zoom < 14.5) {
          vehicleData.previousViewport = {
            zoom,
            longitude: vpLng,
            latitude: vpLat
          };
          const [longitude, latitude] = vehicleData.coordinates;
          dispatch(
            zoomToCustomViewport({
              longitude,
              latitude,
              zoom: SINGLE_FEATURE_ZOOM_LEVEL
            })
          );
        }
      }

      dispatch({ type: DATA_SET_SELECTED_VEHICLE, payload: vehicleData });
    }
  };
};

export const setTripEventDataPromise = (tripEventData = {}) => {
  return dispatch => {
    return new Promise(resolve => {
      return resolve(
        dispatch({ type: DATA_SET_TRIP_EVENT, payload: tripEventData })
      );
    });
  };
};

export const setPreviousLocations = (prevLocationHashMap = {}) => ({
  type: DATA_SET_PREVIOUS_LOCATIONS,
  payload: prevLocationHashMap
});

export const setVehicleList = (vehicleListObj = {}) => ({
  type: DATA_SET_VEHICLE_LIST,
  payload: vehicleListObj
});

export const initializeVehicleList = ({
  vehicles = [],
  offset = null,
  vehicleCount = 0,
  filters = null
} = {}) => {
  const vehicleList = {
    vehicles: reformatVehicles(vehicles),
    offset: offset || null,
    vehicleCount,
    filters: _clone(filters)
  };
  return setVehicleList(vehicleList);
};

export const setVehicleListNextPage = ({ offset: nextPageOffset, filters }) => {
  return (dispatch, getState) => {
    return new Promise((resolve, reject) => {
      if (!nextPageOffset) return reject();

      const updateVehicleList = ({ newVehicles = [], offset }) => {
        const {
          data: { vehicleList }
        } = getState();

        const { filters: currListFilters } = vehicleList;
        const sameVehicleList = _isEqual(currListFilters, filters);
        if (sameVehicleList) {
          const updatedVehicleList = update(vehicleList, {
            vehicles: {
              $push: newVehicles
            },
            $merge: { offset: offset || null }
          });
          dispatch(setVehicleList(updatedVehicleList));
        }
      };

      getClusteredVehicles({ filters, offset: nextPageOffset })
        .then(({ vehicles = [], offset }) => {
          const newVehicles = reformatVehicles(vehicles);
          updateVehicleList({ newVehicles, offset });
          resolve();
        })
        .catch(err => {
          updateVehicleList({ newVehicles: [], offset: null });
          reject(err);
        });
    });
  };
};

export const setMapVehicles = (vehicles = [], { freshState } = {}) => {
  return (dispatch, getState) => {
    const {
      data: { prevLocations },
      map: { viewport }
    } = getState();

    const newPrevLocMap = {};
    const zoomedIn = viewport.zoom >= ZOOMED_IN_THRESHOLD;

    const formattedVehicles = reformatVehicles(vehicles);
    const validVehicles = validateVehicleCoords(formattedVehicles);
    const resultsWithPrevLoc = validVehicles.map(vehicle => {
      const prevLocation = getPrevLocation(prevLocations, vehicle);
      const newLoc = vehicle.coordinates;
      const isNewLocation = freshState
        ? false
        : twoUniquePoints(prevLocation, newLoc);
      if (zoomedIn && !freshState) {
        newPrevLocMap[vehicle.properties.vin] = newLoc;
      }

      return {
        ...vehicle,
        isNewLocation,
        prevLocation
      };
    });

    dispatch(setPreviousLocations(newPrevLocMap));
    dispatch({ type: DATA_SET_MAP_VEHICLES, payload: resultsWithPrevLoc });
  };
};

export const setMapClusters = (clusters = []) => ({
  type: DATA_SET_MAP_CLUSTERS,
  payload: clusters
});

export const zoomedRefreshVehicles = ({ filters, mapOnly, source }) => {
  return dispatch => {
    getFilteredVehicles(filters)
      .then(({ vehicles = [], filters } = {}) => {
        const vehicleCount = vehicles.length;
        const freshState = !!source;
        if (!mapOnly) {
          dispatch(initializeVehicleList({ vehicles, vehicleCount }));
        }
        dispatch(setMapVehicles(vehicles, { freshState }));
        dispatch(setUpdatedFilters(filters));
      })
      .catch(() => dispatch(clearVehiclesAndMap()));
  };
};

export const refreshVehicles = ({
  source,
  forceUpdate = false,
  mapOnly = false
} = {}) => {
  return (dispatch, getState) => {
    let {
      filters,
      map: {
        viewport,
        mapBoundary,
        searchOnMapMove,
        viewport: { zoom }
      },
      views: { filterIdOpen, tripHistoryView, otaSidebarOpen }
    } = getState();

    const refreshDisabled = filterIdOpen || tripHistoryView || otaSidebarOpen;
    if (!forceUpdate && refreshDisabled) return;

    const zoomedIn = zoom >= ZOOMED_IN_THRESHOLD;
    const fromLocationFilter = source === "location";
    const formattedFilters = reformatFilters(filters);
    let boundaries = formattedFilters.boundaries;
    const selectedLocations = filters.location.options;
    const userSelectedLocations = selectedLocations.length > 0;

    if (!searchOnMapMove && !fromLocationFilter) {
      const bboxUserMapView = getBboxArrayFromViewport(viewport);
      const mapViewIntersection = turfIntersect(
        bboxPolygon(bboxUserMapView),
        mapBoundary
      );
      if (mapViewIntersection) {
        mapBoundary = mapViewIntersection;
      } else return;
    }

    if (userSelectedLocations && !fromLocationFilter) {
      const allLocationsWithinMapView = boundaries.every(bbox =>
        turfWithin(bboxPolygon(bbox), mapBoundary)
      );

      if (!allLocationsWithinMapView && !fromLocationFilter) {
        const intersections = boundaries
          .map(bbox => turfIntersect(bboxPolygon(bbox), mapBoundary))
          .filter(intersection => intersection !== null);

        if (intersections.length) {
          const newBoundaries = intersections.map(geoJSON => turfBbox(geoJSON));
          mapOnly = true;
          formattedFilters.boundaries = newBoundaries;
          boundaries = newBoundaries;
        } else {
          return;
        }
      }
    } else if (!userSelectedLocations) {
      const currMapBoundary = formatGeoJSONForGeoQuery(mapBoundary);
      formattedFilters.boundaries = currMapBoundary;
      boundaries = currMapBoundary;
    }

    if (
      zoomedIn &&
      (!fromLocationFilter || (fromLocationFilter && !userSelectedLocations))
    ) {
      return dispatch(
        zoomedRefreshVehicles({ filters: formattedFilters, mapOnly, source })
      );
    }

    const searchingNewLocations = fromLocationFilter && userSelectedLocations;
    const clusters = { zoom: searchingNewLocations ? 0 : zoom };
    getClusteredVehicles({ filters: formattedFilters, clusters })
      .then(
        ({
          clusters = [],
          vehicles = [],
          filters,
          vehicleCount = 0,
          offset
        }) => {
          if (
            !fromLocationFilter ||
            (fromLocationFilter && !userSelectedLocations)
          ) {
            dispatch(setMapClusters(clusters));
          }
          if (!mapOnly) {
            dispatch(
              initializeVehicleList({
                vehicles,
                vehicleCount,
                offset,
                filters: formattedFilters
              })
            );
          }
          dispatch(setUpdatedFilters(filters));
          dispatch(setPreviousLocations({}));

          if (searchingNewLocations) {
            const geoJSON = formatClustersToGeoJSON(clusters);
            const locations = mergeSelectedLocations(selectedLocations);
            dispatch(
              zoomToGeoJSON(vehicleCount ? geoJSON : locations, {
                updateMapBoundary: searchOnMapMove ? false : true
              })
            );
          }
        }
      )
      .catch(() => dispatch(clearVehiclesAndMap()));
  };
};

export const setFilteredWorldVehicles = ({ appLoad, fromOta } = {}) => {
  return (dispatch, getState) => {
    const { filters } = getState();
    const formattedFilters = reformatFilters(
      appLoad ? defaultFilters : filters
    );
    formattedFilters.boundaries = formatGeoJSONForGeoQuery(WORLD_VIEW_GEOJSON);

    const clusters = { zoom: 0 };
    return new Promise(resolve => {
      getClusteredVehicles({ filters: formattedFilters, clusters })
        .then(
          ({
            clusters = [],
            vehicles = [],
            filters,
            vehicleCount = 0,
            offset
          }) => {
            dispatch(
              initializeVehicleList({
                vehicles,
                vehicleCount,
                offset,
                filters: formattedFilters
              })
            );
            dispatch(setUpdatedFilters(filters));
            if (appLoad || fromOta) {
              const clustersGeoJSON = formatClustersToGeoJSON(clusters);
              dispatch(zoomToGeoJSON(clustersGeoJSON));
            }
            resolve();
          }
        )
        .catch(() => {
          dispatch(clearVehiclesAndMap());
          resolve();
        });
    });
  };
};

const clearVehiclesAndMap = () => {
  return dispatch => {
    dispatch(setMapVehicles([]));
    dispatch(initializeVehicleList());
    dispatch(setMapClusters([]));
    dispatch(setPreviousLocations({}));
    dispatch(setMultipleFilters(defaultAnomaliesTroubleCodes));
  };
};
