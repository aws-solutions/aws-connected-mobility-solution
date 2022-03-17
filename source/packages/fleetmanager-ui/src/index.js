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
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import Amplify from "aws-amplify";
import AppWithAuth from "./AppWithAuth";
import CssBaseline from "@material-ui/core/CssBaseline";
import { ThemeProvider } from "@material-ui/styles";
import ErrorBoundary from "components/global/ErrorBoundary";
import { createMuiTheme } from "@material-ui/core/styles";
import awsConfig from "./awsConfig";
import store from "store";
import "assets/css/index.css";

Amplify.configure(awsConfig);

const theme = createMuiTheme({
  typography: {
    fontFamily: ["-apple-system", "BlinkMacSystemFont", "AmazonEmber"].join(",")
  }
});

ReactDOM.render(
  <ErrorBoundary>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppWithAuth />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </ErrorBoundary>,
  document.getElementById("root")
);
