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
  EVENT_SOURCE_GEOJSON,
  EVENT_LAYER_MARKER,
  ICON_EVENT_MARKER
} from "./names";

export const keys = { eventGeoJSON: "eventGeoJSON" };

export const sources = [
  { dataKey: keys.eventGeoJSON, id: EVENT_SOURCE_GEOJSON }
];

export const layers = [
  {
    id: EVENT_LAYER_MARKER,
    source: EVENT_SOURCE_GEOJSON,
    type: "symbol",
    layout: {
      "icon-image": ICON_EVENT_MARKER,
      "icon-size": ["interpolate", ["linear"], ["zoom"], 8, 0.2, 12, 0.8],
      "icon-rotation-alignment": "map"
    }
  }
];
