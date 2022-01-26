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
import { featureCollection } from "@turf/helpers";
import bbox from "@turf/bbox";
import bboxPolygon from "@turf/bbox-polygon";
import {
  createLineString,
  createPoint,
  union,
  getGeoJSONType,
  getMultipolygonBoundingBoxes
} from "utils/geojsonHelpers";
import _get from "lodash.get";
import { isStringInteger } from "utils/helpers";
import { validCoord } from "utils/geojsonHelpers";
import * as eventStyle from "assets/mapbox/eventStyle";
import * as tripStyle from "assets/mapbox/tripStyle";

export const formatGeoJSONForGeoQuery = geoJSON => {
  const type = getGeoJSONType(geoJSON);
  if (type === "MultiPolygon") {
    return getMultipolygonBoundingBoxes(geoJSON);
  } else return [bbox(geoJSON)];
};

export const mergeSelectedLocations = (selectedLocations = []) => {
  const multipleLocations = selectedLocations.length > 1;
  const locationGeoJSONs = selectedLocations.map(({ geoJSON }) => geoJSON);
  return multipleLocations ? union(locationGeoJSONs) : locationGeoJSONs[0];
};

export const getGeocoderAddressData = mapboxResp => {
  const data = _get(mapboxResp, "features[0]");
  if (!data) return {};

  const num = data.address;
  const street = data.text;
  let city, postcode, state;
  for (let con of data.context) {
    if (con.id.startsWith("postcode")) postcode = con.text;
    if (con.id.startsWith("place")) city = con.text;
    if (con.id.startsWith("region") && con.short_code)
      state = con.short_code.split("-").slice(-1)[0];
  }
  return {
    address: !num && !street ? null : `${num ? num + " " : ""}${street}`,
    city,
    state,
    postcode
  };
};

export const validateVehicleCoords = (vehicles = []) =>
  vehicles.filter(({ coordinates }) => validCoord(coordinates));

export const reformatVehicle = (vehicle = {}) => {
  const { geoLocation, telemetry, devices, ...otherProps } = vehicle;
  const { coordinates = [] } = geoLocation || {};
  const firstDeviceProps = _get(devices, "[0]", {});
  const formattedVehicle = {
    coordinates,
    properties: Object.assign(
      {},
      otherProps,
      telemetry,
      firstDeviceProps,
      geoLocation
    )
  };
  return formattedVehicle;
};

export const reformatVehicles = (vehicles = []) =>
  vehicles.map(reformatVehicle);

export const formatClustersToGeoJSON = (clusters = []) => {
  const features = clusters.map(({ properties }) => {
    return bboxPolygon(properties.bbox, { properties });
  });
  return featureCollection(features);
};

export const formatResultsToGeoJSON = (results = []) => {
  const validResults = validateVehicleCoords(results);
  const features = validResults.map(({ coordinates, properties }) => {
    return createPoint(coordinates, properties);
  });
  return featureCollection(features);
};

export const twoUniquePoints = (coords1 = [], coords2 = []) => {
  const [long1, lat1] = coords1;
  const [long2, lat2] = coords2;
  if (long1 !== long2 || lat1 !== lat2) return true;
  return false;
};

export const getPrevLocation = (prevLocationMap = {}, vehicle = {}) => {
  const {
    coordinates,
    properties: { vin }
  } = vehicle;
  const prevCoord = prevLocationMap[vin];
  if (!prevCoord) return coordinates;
  const isNewLocation = twoUniquePoints(prevCoord, coordinates);
  return isNewLocation ? prevCoord : coordinates;
};

export const getSelectedFilterIds = (options = []) =>
  options.filter(({ selected }) => selected).map(({ id }) => id);

export const getOptionLabels = (options = [], { isYear } = {}) =>
  options
    .filter(({ label }) => (isYear ? isStringInteger(label) : true))
    .map(({ label }) => (isYear ? parseInt(label) : label));

export const buildDeviceExecutionsUpdateObj = ({
  executionSummaries = [],
  deviceIndexMap = {}
}) => {
  return executionSummaries.reduce((updateObject, { execution }) => {
    const { thingArn, lastUpdatedAt, queuedAt, startedAt, status } = execution;
    const deviceId = thingArn.split("thing/").slice(-1)[0];
    const deviceIndex = deviceIndexMap[deviceId];
    if (deviceIndex !== undefined) {
      updateObject[deviceIndex] = {
        $merge: { status, lastUpdatedAt, queuedAt, startedAt }
      };
    }
    return updateObject;
  }, {});
};

export const buildEventForMap = ({ event, coordinates }) => {
  const { keys, sources, layers } = eventStyle;

  return {
    ...event,
    [keys.eventGeoJSON]: createPoint(coordinates),
    layers,
    sources
  };
};

export const buildTripForMap = ({ trip, coordArr }) => {
  const { keys, sources, layers } = tripStyle;
  const startLocation = coordArr[0];
  const endLocation = coordArr.slice(-1)[0];

  return {
    ...trip,
    [keys.tripGeoJSON]: createLineString(coordArr),
    [keys.startGeoJSON]: createPoint(startLocation),
    [keys.endGeoJSON]: createPoint(endLocation),
    sources,
    layers,
    isTrip: true
  };
};

export const reformatFilters = (filters, { otaFilters = false } = {}) => {
  const { anomalies, troubleCodes, location, vehicle, software } = filters;

  const formattedFilters = {
    troubleCodes: getSelectedFilterIds(troubleCodes.options),
    vehicle: {
      vin: getOptionLabels(vehicle.vin.options),
      make: getOptionLabels(vehicle.make.options),
      model: getOptionLabels(vehicle.model.options),
      year: getOptionLabels(vehicle.year.options, { isYear: true })
    },
    software: {
      swVersion: getOptionLabels(software.version.options)[0] || ""
    }
  };

  if (!otaFilters) {
    formattedFilters.anomalies = getSelectedFilterIds(anomalies.options);

    const userSelectedLocations = location.options.length > 0;
    if (userSelectedLocations) {
      const mergedLocations = mergeSelectedLocations(location.options);
      formattedFilters.boundaries = formatGeoJSONForGeoQuery(mergedLocations);
    }
  }

  return formattedFilters;
};
