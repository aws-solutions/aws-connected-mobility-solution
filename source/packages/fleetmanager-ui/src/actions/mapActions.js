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
import {
  MAP_SET_VIEWPORT,
  MAP_SET_MAPBOX_TOKEN,
  MAP_SET_VALID_MAPBOX_TOKEN,
  MAP_SET_SEARCH_ON_MAP_MOVE,
  MAP_SET_MAP_BOUNDARY
} from "./types";
import bbox from "@turf/bbox";
import bboxPolygon from "@turf/bbox-polygon";
import { FlyToInterpolator } from "react-map-gl";
import WebMercatorViewport from "viewport-mercator-project";
import { validCoord, fixBoundingBox } from "utils/geojsonHelpers";
import { getZoomDuration } from "utils/mapHelpers";
import { verifyToken } from "apis/mapbox";
import { getBboxArrayFromViewport } from "utils/mapHelpers";
import { refreshVehicles } from "actions/dataActions";
import { SINGLE_FEATURE_ZOOM_LEVEL } from "assets/appConfig";

export const setMapViewport = viewport => ({
  type: MAP_SET_VIEWPORT,
  payload: viewport
});

export const zoomToGeoJSON = (
  geoJSON,
  { tripPadding = false, updateMapBoundary = false } = {}
) => {
  return (dispatch, getState) => {
    const {
      map: { viewport }
    } = getState();

    const geoJsonBbox = bbox(geoJSON);
    if (geoJsonBbox.every(bound => !Number.isFinite(bound))) return;

    const { width, height } = viewport;
    if (!width || !height) return;

    let padding = 100;
    if (width <= 200 || height <= 200) padding = 0;

    const [minLng, minLat, maxLng, maxLat] = geoJsonBbox;
    const viewportMerc = new WebMercatorViewport(viewport);

    const vPadding = Math.min(Math.floor(height / 2), 150);
    const left = Math.min(Math.floor(width * 0.95 * 0.7), 350);
    const right = Math.min(Math.floor(width * 0.95 * 0.3), 150);

    const { longitude, latitude, zoom } = viewportMerc.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat]
      ],
      {
        padding: tripPadding
          ? { top: vPadding, bottom: vPadding, left, right }
          : padding
      }
    );

    if (updateMapBoundary) {
      const newBoundaryMerc = new WebMercatorViewport({
        width,
        height,
        longitude,
        latitude,
        zoom
      });
      const [minLng, maxLat] = newBoundaryMerc.unproject([0, 0]);
      const [maxLng, minLat] = newBoundaryMerc.unproject([
        newBoundaryMerc.width,
        newBoundaryMerc.height
      ]);
      const newMapBoundary = [minLng, minLat, maxLng, maxLat];
      dispatch(setMapBoundary(newMapBoundary, { forceUpdate: true }));
    }

    dispatch(
      zoomToCustomViewport({
        longitude,
        latitude,
        zoom: Math.min(zoom, SINGLE_FEATURE_ZOOM_LEVEL)
      })
    );
  };
};

export const zoomToCustomViewport = ({ longitude, latitude, zoom } = {}) => {
  return (dispatch, getState) => {
    if (!validCoord([longitude, latitude])) return;

    const {
      map: { viewport }
    } = getState();

    const newViewport = {
      ...viewport,
      longitude,
      latitude,
      zoom,
      transitionInterpolator: new FlyToInterpolator({ speed: 3 }),
      transitionDuration: "auto"
    };

    dispatch(setMapViewport(newViewport));
  };
};

export const zoomOutToWorldView = () => {
  return (dispatch, getState) => {
    return new Promise(resolve => {
      const {
        map: { viewport }
      } = getState();

      const transitionDuration = 0.6 * getZoomDuration(viewport.zoom, 0);
      const newViewport = {
        ...viewport,
        zoom: 0,
        latitude: 0,
        transitionInterpolator: new FlyToInterpolator({ speed: 6 }),
        transitionDuration
      };

      dispatch(setMapViewport(newViewport));
      setTimeout(() => resolve(), transitionDuration);
    });
  };
};

export const setMapboxToken = (token, { verify } = {}) => {
  return dispatch => {
    dispatch({
      type: MAP_SET_MAPBOX_TOKEN,
      payload: token || ""
    });

    if (verify)
      verifyToken(token).then(isValid =>
        dispatch(setValidMapboxToken(isValid))
      );
  };
};

export const setValidMapboxToken = isValid => ({
  type: MAP_SET_VALID_MAPBOX_TOKEN,
  payload: isValid
});

export const setSearchOnMapMove = checked => {
  return (dispatch, getState) => {
    dispatch({ type: MAP_SET_SEARCH_ON_MAP_MOVE, payload: checked });

    if (checked) {
      const {
        map: { viewport }
      } = getState();

      const currMapViewBboxArr = getBboxArrayFromViewport(viewport);
      dispatch(setMapBoundary(currMapViewBboxArr, { forceUpdate: true }));
      dispatch(refreshVehicles({ source: "searchOnMapMove" }));
    }
  };
};

export const setMapBoundary = (bboxArray, { forceUpdate } = {}) => {
  return (dispatch, getState) => {
    const {
      map: { searchOnMapMove }
    } = getState();

    if (searchOnMapMove || forceUpdate) {
      const payload = bboxPolygon(fixBoundingBox(bboxArray));
      dispatch({ type: MAP_SET_MAP_BOUNDARY, payload });
    }
  };
};
