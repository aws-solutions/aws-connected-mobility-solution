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
import { convertRemToPx } from "utils/helpers";

export const rightSidebar = {
  width: "28.125rem"
};

export const otaSidebar = {
  width: "14.5rem",
  scrollbarWidth: "0.375rem"
};

export const appBar = {
  height: "3.25rem"
};

export const filtersBar = {
  height: "2.875rem",
  menuTopOffetFromBar: "0.625rem"
};

export const filters = {
  minMenuHeight: "6.5rem",
  menuFixedTopPositionPx:
    convertRemToPx(appBar.height) +
    convertRemToPx(filtersBar.height) +
    convertRemToPx(filtersBar.menuTopOffetFromBar),
  menuHeightBufferPx:
    convertRemToPx(appBar.height) +
    convertRemToPx(filtersBar.height) +
    2 * convertRemToPx(filtersBar.menuTopOffetFromBar),
  getMaxFilterMenuHeight: function () {
    return Math.max(
      document.body.offsetHeight - this.menuHeightBufferPx,
      convertRemToPx(this.minMenuHeight)
    );
  }
};

export const toggleSidebarBtn = {
  height: "2.5rem",
  width: "4.75rem",
  topOffset: "0.625rem"
};

export const mapControls = {
  topOffset: "1.875rem",
  rightOffset: "1.875rem",
  _MAPBOX_ZOOM_BUTTONS_WIDTH: "30px",
  _MAPBOX_ZOOM_BUTTONS_HEIGHT: "60px"
};

export const ota = {
  jobTitleCardHeight: "2.25rem",
  maxJobListHeight: "24.5rem",
  singleJobHeaderHeight: "1.75rem",
  singleJobRowHeight: "2.125rem",
  marginBottomPixels: 1
};

export const otaClosedCardHeightPx =
  convertRemToPx(ota.jobTitleCardHeight) + ota.marginBottomPixels;
export const otaHeaderHeightPx = convertRemToPx(ota.singleJobHeaderHeight);
export const otaMaxDetailsBoxHeightPx = convertRemToPx(ota.maxJobListHeight);

export const calcOtaJobDetailsHeightPx = (totalRows = 0) => {
  const totalRowsHeight = totalRows * convertRemToPx(ota.singleJobRowHeight);
  const renderedDetailsContainerHeight = totalRowsHeight + otaHeaderHeightPx;
  return Math.min(renderedDetailsContainerHeight, otaMaxDetailsBoxHeightPx);
};

export const calcOtaOpenCardHeightPx = (totalRows = 0) =>
  otaClosedCardHeightPx + calcOtaJobDetailsHeightPx(totalRows);
