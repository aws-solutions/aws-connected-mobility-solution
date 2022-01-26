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
import getClusterPaintStyle from "./getClusterPaintStyle";
import {
  MAP_SOURCE_VEHICLES,
  MAP_LAYER_VEHICLES_CLUSTER,
  MAP_LAYER_VEHICLES_CLUSTER_COUNT,
  MAP_LAYER_VEHICLES_SINGLE,
  ICON_PRIME_VAN
} from "./names";

export default [
  {
    id: MAP_LAYER_VEHICLES_CLUSTER,
    type: "circle",
    source: MAP_SOURCE_VEHICLES,
    filter: ["has", "point_count"],
    paint: getClusterPaintStyle("point_count")
  },
  {
    id: MAP_LAYER_VEHICLES_CLUSTER_COUNT,
    type: "symbol",
    source: MAP_SOURCE_VEHICLES,
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12
    },
    paint: {
      "text-color": "#ffffff"
    }
  },
  {
    id: MAP_LAYER_VEHICLES_SINGLE,
    type: "symbol",
    source: MAP_SOURCE_VEHICLES,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": ICON_PRIME_VAN,
      "icon-size": 0.7,
      "icon-rotate": ["get", "heading"],
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true
    }
  }
];
