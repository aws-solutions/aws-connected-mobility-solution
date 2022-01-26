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
const vehicleMappings = {
  "telemetry.currentSpeed": { label: "Current Speed", unit: "mph" },
  "telemetry.fuelLevel": { label: "Fuel Level", unit: "gal" },
  "telemetry.odometer": { label: "Odometer", unit: "mi" },
  "telemetry.oilTemp": { label: "Oil Temp", unit: "F" },
  transmission: { label: "Transmission" },
  fuelType: { label: "Fuel Type" },
  // "telemetry.maxSpeed": { label: "Max Trip Speed", unit: "mph" },
  bodyType: { label: "Vehicle Type" }
  // ,"telemetry.tripFuel": { label: "Trip Fuel", unit: "gal" }
};

export default vehicleMappings;
export const vehicleKeys = Object.keys(vehicleMappings);
