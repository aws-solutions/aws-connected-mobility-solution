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
export const detectEnterKey = event => {
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  return false;
};

export const pluralize = number => {
  if (typeof number !== "number") return "";
  return number !== 1 ? "s" : "";
};

export const convertRemToPx = remStr => Math.round(parseFloat(remStr) * 16);

export const addCommasToNumber = number =>
  number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const shortenNumber = number => {
  number = Math.round(number);
  var SI_POSTFIXES = ["", "k", "M", "G", "T", "P", "E"];
  var tier = (Math.log10(Math.abs(number)) / 3) | 0;
  if (tier === 0) return number;
  var postfix = SI_POSTFIXES[tier];
  var scale = Math.pow(10, tier * 3);
  var scaled = number / scale;
  var formatted = scaled.toFixed(1) + "";
  if (/\.0$/.test(formatted))
    formatted = formatted.substr(0, formatted.length - 2);
  return formatted + postfix;
};

export const isStringInteger = (str = "") => /^(?:[1-9]\d*|\d)$/.test(str);
export const isStringLikeSemVer = (str = "") =>
  /^(?!0{2})[0-9_]+(?:\.[0-9_]+)*$/.test(str);
