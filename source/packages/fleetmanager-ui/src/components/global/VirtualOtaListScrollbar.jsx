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
import VirtualListCustomScrollbar from "./VirtualListCustomScrollbar";
import { otaSidebar } from "assets/dimensions";
import { otaScrollbar, otaScrollbarBackground } from "assets/colors";

const VirtualOtaListScrollbar = ({ fwdRef, ...props }) => (
  <VirtualListCustomScrollbar
    autoHide={false}
    renderTrackVertical={({ style }) => (
      <div
        style={{
          ...style,
          width: otaSidebar.scrollbarWidth,
          right: 0,
          bottom: 0,
          top: 0,
          borderRadius: 3,
          backgroundColor: otaScrollbarBackground
        }}
      />
    )}
    renderThumbVertical={({ style }) => (
      <div
        style={{
          ...style,
          width: otaSidebar.scrollbarWidth,
          cursor: "pointer",
          borderRadius: "inherit",
          backgroundColor: otaScrollbar
        }}
      />
    )}
    ref={fwdRef}
    {...props}
  />
);

export default React.forwardRef((props, ref) => (
  <VirtualOtaListScrollbar {...props} fwdRef={ref} />
));
