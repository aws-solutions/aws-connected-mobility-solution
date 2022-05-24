/*--------------------------------------------------------------------------------------------------------------------
#  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
#                                                                                                                    *
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
#  with the License. A copy of the License is located at                                                             *
#                                                                                                                    *
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    *
#                                                                                                                    *
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
#  and limitations under the License.                                                                                *
#-------------------------------------------------------------------------------------------------------------------*/
import yargs from 'yargs';
import { logger } from './utils/logger';
import { Vehicle } from './vehicle';
import { Route } from './dynamics/route-calc';
import * as fs from 'fs';
import { ModelInitializationParams } from './dynamics/models';
import config from 'config';

// parse the command args
const argv = yargs
    .usage('Usage: $0 <command> [options]')
    .string(['deviceId'])
    .describe('deviceId', 'The TCU device Id')
    .string(['vin'])
    .describe('vin', 'The vehicle\'s VIN')
    .number(['odometer'])
    .describe('odometer', 'The vehicle\'s odometer reading')
    .number(['fuelTankCapacity'])
    .describe('fuelTankCapacity', 'The vehicle\'s fuel tank capacity (in liters)')
    .string(['startTime'])
    .describe('startTime', 'The time to start the vehicle\'s journey')
    .number(['latitude'])
    .describe('latitude', 'Vehicle\s starting location')
    .number(['longitude'])
    .describe('longitude', 'Vehicle\s starting longitude')
    .string(['routePath'])
    .describe('routePath', 'Local path to the route file')
    .string(['routeS3Bucket'])
    .describe('routeS3Bucket', 'S3 Bucket location of the route file')
    .string(['routeS3Key'])
    .describe('routeS3Key', 'S3 key location of the route file')
    .string(['simulationId'])
    .describe('simulationId', 'Correlates telemetry with a specific simulation')
    .demandOption(['deviceId', 'vin', 'odometer', 'fuelTankCapacity', 'simulationId'])
    .argv;

let route:Route;
if (argv.routePath!==undefined) {
    const geojson = fs.readFileSync(argv.routePath, 'utf8');
    route = JSON.parse(geojson) as Route;
}

logger.info(`config: ${JSON.stringify(config.util.toObject(), undefined, 2)}`);

logger.info(`parameters: ${JSON.stringify(argv)}`);

const params:ModelInitializationParams = {
    deviceId:argv.deviceId,
    route,
    routeS3Bucket: argv.routeS3Bucket,
    routeS3Key: argv.routeS3Key,
    vin:argv.vin,
    odometer:argv.odometer,
    fuelTankCapacity: argv.fuelTankCapacity,
    startTime: argv.startTime,
    latitude: argv.latitude,
    longitude: argv.longitude,
    simulationId: argv.simulationId
};

const sampler = new Vehicle(params);
sampler.start()
.then(()=> logger.info('start compelte'))
.catch(err=> logger.error(err.message));
