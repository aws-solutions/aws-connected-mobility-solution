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
import WebMercatorViewport from "viewport-mercator-project";

export const getBboxArrayFromViewport = viewport => {
  const viewportMerc = new WebMercatorViewport(viewport);
  const [minLng, maxLat] = viewportMerc.unproject([0, 0]);
  const [maxLng, minLat] = viewportMerc.unproject([
    viewportMerc.width,
    viewportMerc.height
  ]);
  return [minLng, minLat, maxLng, maxLat];
};

export const getZoomDuration = (currZoom, newZoom) => {
  const zoomDiff = Math.abs(currZoom - newZoom);
  const zoomTime = (1 / 6) * zoomDiff * 1400;
  const transDuration = Math.max(400, zoomTime);
  return Math.min(transDuration, 3800);
};
