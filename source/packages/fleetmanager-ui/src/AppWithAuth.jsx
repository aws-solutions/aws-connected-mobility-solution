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
import React, { Suspense, useState } from "react";
import { Authenticator, SignIn, SignOut, Greetings } from "aws-amplify-react";
import awsConfig from "awsConfig";

const App = React.lazy(() => import("App"));
const LandingPage = React.lazy(() =>
  import("components/landing-page/LandingPage")
);

const AppWithAuth = () => {
  const [authState, setAuthState] = useState();
  const stateChangeHandler = state => setAuthState(state);
  const signedIn = authState === "signedIn";

  return (
    <Suspense fallback={<div />}>
      <Authenticator
        hide={[SignIn, SignOut, Greetings]}
        amplifyConfig={awsConfig.Auth}
        onStateChange={stateChangeHandler}
      >
        {signedIn ? <App /> : <LandingPage />}
      </Authenticator>
    </Suspense>
  );
};

export default AppWithAuth;
