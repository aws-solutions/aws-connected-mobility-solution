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
import { Scrollbars } from "react-custom-scrollbars";

const VirtualListCustomScrollbar = React.forwardRef(
  (
    { onScroll, style, children, autoHide = true, ...otherProps },
    forwardedRef
  ) => {
    const refSetter = React.useCallback(
      scrollbarsRef => {
        if (scrollbarsRef) {
          forwardedRef(scrollbarsRef.view);
        } else {
          forwardedRef(null);
        }
      },
      [forwardedRef]
    );

    return (
      <Scrollbars
        ref={refSetter}
        style={{
          ...style,
          overflow: "hidden"
        }}
        onScroll={onScroll}
        autoHide={autoHide}
        hideTracksWhenNotNeeded
        renderTrackHorizontal={() => <div style={{ display: "none" }} />}
        {...otherProps}
      >
        {children}
      </Scrollbars>
    );
  }
);

export default VirtualListCustomScrollbar;
