import { UPDATE_TABLE_SETTING, UPDATE_MULTIPLE_TABLE_SETTINGS } from "./types";

export const setSingleSetting = (keyName, payload) => ({
  type: UPDATE_TABLE_SETTING,
  payload,
  keyName,
});

export const setMultipleSettings = (keyName, keyName2, payload) => ({
  type: UPDATE_MULTIPLE_TABLE_SETTINGS,
  payload,
  keyName,
  keyName2,
});
