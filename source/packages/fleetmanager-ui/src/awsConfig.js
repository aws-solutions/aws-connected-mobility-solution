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
import { Auth } from "aws-amplify";
import { REGION, USER_POOL_ID, USER_POOL_CLIENT_ID } from "assets/appConfig";
import { CDF_AUTO_ENDPOINT } from "assets/appConfig";
import { CDF_AUTO, MAPBOX } from "apis/_NAMES";

export default {
  Auth: {
    mandatorySignIn: true,
    region: REGION,
    userPoolId: USER_POOL_ID,
    userPoolWebClientId: USER_POOL_CLIENT_ID
  },
  API: {
    endpoints: [
      {
        name: CDF_AUTO,
        endpoint: `${CDF_AUTO_ENDPOINT}`,
        custom_header: async () => {
          return {
            Authorization: `${(await Auth.currentSession())
              .getIdToken()
              .getJwtToken()}`
          };
        }
      },
      {
        name: MAPBOX,
        endpoint: "https://api.mapbox.com"
      }
    ]
  }
};
