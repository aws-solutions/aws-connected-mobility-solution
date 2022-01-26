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
import { API } from "aws-amplify";
import { MAPBOX } from "apis/_NAMES";

export const reverseGeocoder = ({ long, lat, MAPBOX_TOKEN }) =>
  API.get(
    MAPBOX,
    `/geocoding/v5/mapbox.places/${long},${lat}.json?limit=1&access_token=${MAPBOX_TOKEN}`
  );

export const forwardGeocoder = ({ query, MAPBOX_TOKEN }) =>
  API.get(
    MAPBOX,
    `/geocoding/v5/mapbox.places/${query}.json?autocomplete=true&types=country%2Cregion%2Cpostcode%2Cdistrict%2Cplace%2Clocality&access_token=${MAPBOX_TOKEN}`
  );

export const verifyToken = async MAPBOX_TOKEN => {
  try {
    await reverseGeocoder({ long: -118, lat: 34, MAPBOX_TOKEN });
    return true;
  } catch {
    return false;
  }
};
