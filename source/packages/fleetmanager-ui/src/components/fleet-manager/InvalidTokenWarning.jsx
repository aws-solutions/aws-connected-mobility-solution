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
import React from "react";
import MapboxTokenUserSetting from "components/fleet-manager/MapboxTokenUserSetting";

const InvalidTokenWarning = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      width: "100%",
      alignItems: "center",
      justifyContent: "center"
    }}
  >
    <h1>Missing/Invalid Mapbox Token</h1>
    <MapboxTokenUserSetting fromTokenWarning />
    <p>
      A Mapbox{" "}
      <a
        href="https://docs.mapbox.com/help/how-mapbox-works/access-tokens/"
        target="_blank"
        rel="noopener noreferrer"
      >
        access token
      </a>{" "}
      is required to use this app.
    </p>
    <p>
      If you do not have a Mapbox account,{" "}
      <a
        href="https://account.mapbox.com/auth/signup/"
        target="_blank"
        rel="noopener noreferrer"
      >
        sign up here.
      </a>
    </p>
  </div>
);

export default InvalidTokenWarning;
