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
import { CDF_AUTO } from "apis/_NAMES";


const BASE_PATH = `/config`;
const MAPBOX_TOKEN_KEY = "mapboxToken";

export const getMapboxToken = async () => {
  try {
    const { mapboxToken } = await API.get(
      CDF_AUTO,
      `${BASE_PATH}?parameter=${MAPBOX_TOKEN_KEY}`
    );
    return mapboxToken;
  } catch (err) {
    throw err;
  }
};

export const putMapboxToken = token =>
  API.put(CDF_AUTO, BASE_PATH, {
    body: {
      name: MAPBOX_TOKEN_KEY,
      description: "Mapbox token",
      value: token
    }
  });
