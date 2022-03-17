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
import { Route, Switch, Redirect } from "react-router-dom";
import ErrorBoundary from "components/global/ErrorBoundary";

const FleetManager = React.lazy(() =>
  import("components/fleet-manager/FleetManager")
);

const Dashboard = React.lazy(() => import("components/dashboard/Dashboard"));
const Analytics = React.lazy(() => import("components/analytics/Analytics"));

const Routes = () => {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div />}>
        <Switch>
          <Route path="/" exact component={Dashboard} />
          <Route path="/map" component={FleetManager} />
          <Route path="/analytics" component={Analytics} />
          <Redirect to="/" />
        </Switch>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default Routes;
