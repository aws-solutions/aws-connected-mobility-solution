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
import { API } from "aws-amplify";
import { CDF_AUTO } from "apis/_NAMES";

export const getAllVehicles = () => API.get(CDF_AUTO, `/vehicles`);

export const getClusteredVehicles = ({
  filters,
  clusters = {},
  offset = 0
}) => {
  return API.get(CDF_AUTO, `/vehicles/aggregate`, {
    queryStringParameters: {
      filters: JSON.stringify({
        filters,
        pagination: { offset, maxResults: 26 },
        clusters
      })
    }
  });
};

export const getFilteredVehicles = filters => {
  return API.get(CDF_AUTO, `/vehicles/filter`, {
    queryStringParameters: {
      filters: JSON.stringify({ filters })
    }
  });
};

export const getSingleVehicle = vin =>
  API.get(CDF_AUTO, `/vehicles/${vin}`);

export const getVehicleTrips = ({ vin, offset = 0 }) => {
  return API.get(CDF_AUTO, `/vehicles/${vin}/trips`, {
    queryStringParameters: {
      filters: JSON.stringify({
        filters: {
          dates: { start: "", end: "" }
        },
        pagination: { offset, maxResults: 40 }
      })
    }
  });
};

export const getTripDataById = tripId =>
  API.get(CDF_AUTO, `/vehicles/route/${tripId}`);

export const getVehicleEvents = ({ vin, offset = 0 }) => {
  return API.get(CDF_AUTO, `/vehicles/${vin}/events`, {
    queryStringParameters: {
      filters: JSON.stringify({
        filters: {
          dates: { start: "", end: "" }
        },
        pagination: { offset, maxResults: 40 }
      })
    }
  });
};

export const getVehiclesByDeviceIds = (deviceIds = []) =>
  API.get(CDF_AUTO, `/vehicles/ota`, {
    queryStringParameters: {
      deviceIds: JSON.stringify(deviceIds)
    }
  });

export const getEventVideoUrlStub = eventId =>
  new Promise((resolve, reject) =>
    eventId ? resolve("/assets/video/event.mp4") : reject("Event ID missing")
  );
