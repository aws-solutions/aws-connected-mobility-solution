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
import { createStore, combineReducers, applyMiddleware, compose } from "redux";
import reduxThunk from "redux-thunk";
import viewsReducer from "./reducers/viewsReducer";
import userReducer from "./reducers/userReducer";
import mapReducer from "./reducers/mapReducer";
import dataReducer from "./reducers/dataReducer";
import filtersReducer from "./reducers/filtersReducer";
import { USER_LOG_OUT } from "actions/types";

const inDevMode = process.env.NODE_ENV === "development";

const appReducer = combineReducers({
  views: viewsReducer,
  user: userReducer,
  map: mapReducer,
  data: dataReducer,
  filters: filtersReducer
});

const rootReducer = (state, action) => {
  if (action.type === USER_LOG_OUT) state = undefined;
  return appReducer(state, action);
};

const composeEnhancers = inDevMode
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  : compose;

export default createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(reduxThunk))
);
