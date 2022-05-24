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
  MAP_SOURCE_CLUSTERS,
  MAP_LAYER_COMBINED_CLUSTER,
  MAP_LAYER_COMBINED_CLUSTER_COUNT,
  MAP_LAYER_CLUSTER,
  MAP_LAYER_CLUSTER_COUNT,
  MAP_LAYER_CLUSTER_SINGLE_VEHICLE,
  ICON_PRIME_VAN
} from "./names";

const abbreviatedCount = propertyName => [
  "step",
  ["get", propertyName],
  ["get", propertyName],
  1000,
  ["concat", ["/", ["round", ["/", ["get", propertyName], 100]], 10], "k"],
  10000,
  ["concat", ["round", ["/", ["get", propertyName], 1000]], "k"],
  1000000,
  ["concat", ["/", ["round", ["/", ["get", propertyName], 100000]], 10], "M"]
];

export default [
  {
    id: MAP_LAYER_COMBINED_CLUSTER,
    type: "circle",
    source: MAP_SOURCE_CLUSTERS,
    filter: ["has", "total_count"],
    paint: getClusterPaintStyle("total_count")
  },
  {
    id: MAP_LAYER_COMBINED_CLUSTER_COUNT,
    type: "symbol",
    source: MAP_SOURCE_CLUSTERS,
    filter: ["has", "total_count"],
    layout: {
      "text-field": abbreviatedCount("total_count"),
      "text-size": 12
    },
    paint: {
      "text-color": "#ffffff"
    }
  },
  {
    id: MAP_LAYER_CLUSTER,
    type: "circle",
    source: MAP_SOURCE_CLUSTERS,
    filter: ["all", ["!", ["has", "total_count"]], [">", ["get", "count"], 1]],
    paint: getClusterPaintStyle("count")
  },
  {
    id: MAP_LAYER_CLUSTER_COUNT,
    type: "symbol",
    source: MAP_SOURCE_CLUSTERS,
    filter: ["all", ["!", ["has", "total_count"]], [">", ["get", "count"], 1]],
    layout: {
      "text-field": abbreviatedCount("count"),
      "text-size": 12
    },
    paint: {
      "text-color": "#ffffff"
    }
  },
  {
    id: MAP_LAYER_CLUSTER_SINGLE_VEHICLE,
    type: "symbol",
    source: MAP_SOURCE_CLUSTERS,
    filter: ["all", ["!", ["has", "total_count"]], ["==", ["get", "count"], 1]],
    layout: {
      "icon-image": ICON_PRIME_VAN,
      "icon-size": 0.7,
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true
    }
  }
];
