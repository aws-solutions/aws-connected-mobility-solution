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
import bboxPolygon from "@turf/bbox-polygon";

const appVariables = window.appVariables || {};

export const USER_POOL_ID = appVariables.USER_POOL_ID;
export const USER_POOL_CLIENT_ID = appVariables.USER_POOL_CLIENT_ID;
export const CDF_AUTO_ENDPOINT = appVariables.CDF_AUTO_ENDPOINT;
export const REGION = appVariables.REGION;

export const ANOMALY_COUNT_THRESHOLD = 0;

export const JOB_EXECUTIONS_REFRESH_INTERVAL = 9000;

export const ZOOMED_IN_THRESHOLD = 14;
export const DEFAULT_UPDATE_INTERVAL = 300 * 1000;
export const ZOOMED_UPDATE_INTERVAL = 3000;

export const SINGLE_FEATURE_ZOOM_LEVEL = 16;

export const WORLD_VIEW_GEOJSON = bboxPolygon([-180, -85, 180, 85]);
