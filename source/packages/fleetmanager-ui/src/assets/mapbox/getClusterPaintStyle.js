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
  largeClusterBg,
  largeClusterOutline,
  smallClusterBg,
  smallClusterOutline,
  mediumClusterBg,
  mediumClusterOutline
} from "assets/colors";

const COUNT = { MEDIUM: 100, LARGE: 750 };

export default countPropertyName => ({
  "circle-color": [
    "step",
    ["get", countPropertyName],
    smallClusterBg,
    COUNT.MEDIUM,
    mediumClusterBg,
    COUNT.LARGE,
    largeClusterBg
  ],
  "circle-radius": [
    "step",
    ["get", countPropertyName],
    20,
    COUNT.MEDIUM,
    30,
    COUNT.LARGE,
    40
  ],
  "circle-stroke-width": 4,
  "circle-stroke-color": [
    "step",
    ["get", countPropertyName],
    smallClusterOutline,
    COUNT.MEDIUM,
    mediumClusterOutline,
    COUNT.LARGE,
    largeClusterOutline
  ]
});
