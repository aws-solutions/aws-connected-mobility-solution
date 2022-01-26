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
  TRIP_SOURCE_ROUTE_GEOJSON,
  TRIP_SOURCE_START_GEOJSON,
  TRIP_SOURCE_END_GEOJSON,
  TRIP_LAYER_ROUTE_LINE,
  TRIP_LAYER_START_MARKER,
  TRIP_LAYER_END_MARKER,
  ICON_TRIP_END_MARKER
} from "./names";
import { darkNavyText, offPink, largeClusterOutline } from "assets/colors";

export const keys = {
  tripGeoJSON: "tripGeoJSON",
  startGeoJSON: "startGeoJSON",
  endGeoJSON: "endGeoJSON"
};

export const sources = [
  { dataKey: keys.tripGeoJSON, id: TRIP_SOURCE_ROUTE_GEOJSON },
  { dataKey: keys.startGeoJSON, id: TRIP_SOURCE_START_GEOJSON },
  { dataKey: keys.endGeoJSON, id: TRIP_SOURCE_END_GEOJSON }
];

export const layers = [
  {
    id: TRIP_LAYER_ROUTE_LINE,
    source: TRIP_SOURCE_ROUTE_GEOJSON,
    type: "line",
    layout: {
      "line-join": "round",
      "line-cap": "round"
    },
    paint: {
      "line-color": darkNavyText,
      "line-width": 6
    }
  },
  {
    id: TRIP_LAYER_START_MARKER,
    source: TRIP_SOURCE_START_GEOJSON,
    type: "circle",
    paint: {
      "circle-color": offPink,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 2, 12, 15],
      "circle-stroke-width": 8,
      "circle-stroke-color": largeClusterOutline
    }
  },
  {
    id: TRIP_LAYER_END_MARKER,
    source: TRIP_SOURCE_END_GEOJSON,
    type: "symbol",
    layout: {
      "icon-image": ICON_TRIP_END_MARKER,
      "icon-size": ["interpolate", ["linear"], ["zoom"], 8, 0.2, 12, 0.8],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true
    }
  }
];
